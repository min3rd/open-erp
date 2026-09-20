import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  PluginVersionItem,
  SharpButtonComponent,
  TranslatePipe,
  apiMessage,
} from '@shared';
import { PluginService } from '../../../core/services/plugin.service';

@Component({
  selector: 'app-tenant-plugin-register-drawer',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DrawerComponent, SharpButtonComponent],
  templateUrl: './tenant-plugin-register-drawer.component.html',
})
export class TenantPluginRegisterDrawerComponent {
  private service = inject(PluginService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  manageKey = input<string | null>(null);

  closed = output<void>();
  changed = output<void>();

  source = signal('DOCKER_HUB');
  busy = signal(false);
  errorText = signal('');
  uploadBusy = signal(false);
  uploadResult = signal('');
  uploadFile = signal<File | null>(null);

  versions = signal<PluginVersionItem[]>([]);
  versionsLoading = signal(false);

  form = signal({
    plugin_key: '',
    name_key: '',
    description_key: '',
    version: '',
    image_ref: '',
    registry_url: '',
    repository: '',
    tag: '',
    checksum: '',
    artifact_ref: '',
    manifest_text: '',
  });

  manageMode = computed<boolean>(() => !!this.manageKey()?.trim());

  titleKey = computed<string>(() =>
    this.manageMode() ? 'PLUGIN_MANAGE_VERSIONS_TITLE' : 'PLUGIN_REGISTER_CUSTOM_TITLE'
  );

  private lastOpen = false;
  private lastKey: string | null = null;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const key = this.manageKey();
      if (!open) {
        this.lastOpen = false;
        this.lastKey = null;
        return;
      }
      if (!this.lastOpen || key !== this.lastKey) {
        this.lastOpen = true;
        this.lastKey = key;
        this.reset();
        if (key) {
          this.loadVersions(key);
        }
      }
    });
  }

  reset(): void {
    this.source.set('DOCKER_HUB');
    this.errorText.set('');
    this.uploadResult.set('');
    this.uploadFile.set(null);
    this.form.set({
      plugin_key: '', name_key: '', description_key: '', version: '',
      image_ref: '', registry_url: '', repository: '', tag: '',
      checksum: '', artifact_ref: '', manifest_text: '',
    });
    const key = this.manageKey();
    if (key) {
      this.form.update((value) => ({ ...value, plugin_key: key }));
    }
    this.versions.set([]);
  }

  loadVersions(pluginKey: string): void {
    this.versionsLoading.set(true);
    this.service.customVersions(pluginKey).subscribe({
      next: (response) => {
        this.versions.set(response.data?.items ?? []);
        this.versionsLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.errorText.set(apiMessage(this.i18n, error));
        this.versionsLoading.set(false);
      },
    });
  }

  onUploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFile.set(input.files && input.files.length ? input.files[0] : null);
  }

  uploadBundle(): void {
    const file = this.uploadFile();
    if (!file) {
      return;
    }
    this.uploadBusy.set(true);
    this.service.uploadArtifact(file).subscribe({
      next: (response) => {
        this.uploadBusy.set(false);
        const result = response.data;
        this.uploadResult.set(`${result?.artifact_ref ?? ''} · ${result?.checksum ?? ''}`);
        this.form.update((value) => ({
          ...value,
          artifact_ref: result?.artifact_ref ?? '',
          checksum: result?.checksum ?? '',
        }));
      },
      error: (error: ApiErrorResponse) => {
        this.uploadBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  submit(): void {
    const value = this.form();
    if (!value.version || (!this.manageMode() && !value.plugin_key)) {
      return;
    }
    let manifest: unknown = undefined;
    if (value.manifest_text.trim()) {
      try {
        manifest = JSON.parse(value.manifest_text);
      } catch {
        this.errorText.set(this.i18n.t('PLUGIN_ARTIFACT_INVALID_MANIFEST'));
        return;
      }
    }
    const versionPayload = {
      source: this.source(),
      version: value.version,
      image_ref: value.image_ref || undefined,
      registry_url: value.registry_url || undefined,
      repository: value.repository || undefined,
      tag: value.tag || undefined,
      checksum: value.checksum || undefined,
      artifact_ref: value.artifact_ref || undefined,
      manifest,
    };
    this.busy.set(true);
    const request = this.manageMode()
      ? this.service.registerCustomVersion(this.manageKey() as string, versionPayload)
      : this.service.registerCustom({
          plugin_key: value.plugin_key,
          name_key: value.name_key,
          description_key: value.description_key,
          ...versionPayload,
        });
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.form.update((current) => ({ ...current, version: '', tag: '' }));
        this.changed.emit();
        if (this.manageMode()) {
          this.loadVersions(this.manageKey() as string);
        } else {
          this.closed.emit();
        }
      },
      error: (error: ApiErrorResponse) => {
        this.busy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  versionAction(version: PluginVersionItem, action: string): void {
    const key = this.manageKey();
    if (!key) {
      return;
    }
    this.service.customVersionAction(key, version.version, action, 'tenant portal').subscribe({
      next: () => this.loadVersions(key),
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }

  removeVersion(version: PluginVersionItem): void {
    const key = this.manageKey();
    if (!key) {
      return;
    }
    this.service.deleteCustomVersion(key, version.version).subscribe({
      next: () => this.loadVersions(key),
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }
}
