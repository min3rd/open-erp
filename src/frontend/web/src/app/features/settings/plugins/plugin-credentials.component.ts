import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import {
  ApiErrorResponse,
  ApiResponse,
  CredentialFormComponent,
  DrawerComponent,
  I18nService,
  PluginCredentialItem,
  PluginCredentialPayload,
  PluginCredentialScope,
  SharpButtonComponent,
  TranslatePipe,
  apiMessage,
} from '@shared';
import { PluginService } from '../../../core/services/plugin.service';
import { PlatformPluginService } from '../../../core/services/platform-plugin.service';
import { PathListState, PathListStateService } from '../../../core/utils/path-list-state';

/**
 * One screen for both platform- and tenant-scoped plugin credentials.
 * Scope (and therefore service + capabilities) comes from route `data.scope`.
 */
@Component({
  selector: 'app-plugin-credentials',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DrawerComponent, CredentialFormComponent, SharpButtonComponent],
  providers: [PathListStateService],
  templateUrl: './plugin-credentials.component.html',
})
export class PluginCredentialsComponent implements OnInit {
  private tenantService = inject(PluginService);
  private platformService = inject(PlatformPluginService);
  private i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private listState = inject(PathListStateService);

  private scopeSignal = signal<PluginCredentialScope>(PluginCredentialScope.TENANT);
  readonly scope = this.scopeSignal.asReadonly();

  readonly supportsEdit = computed(() => this.scopeSignal() === PluginCredentialScope.PLATFORM);
  readonly titleKey = computed(() =>
    this.supportsEdit() ? 'PLUGIN_CREDENTIALS_TITLE' : 'PLUGIN_TENANT_CREDENTIALS_TITLE'
  );
  readonly subtitleKey = computed(() =>
    this.supportsEdit() ? 'PLUGIN_CREDENTIALS_SUBTITLE' : 'PLUGIN_TENANT_CREDENTIALS_SUBTITLE'
  );

  items = signal<PluginCredentialItem[]>([]);
  loading = signal(false);
  errorText = signal('');
  successText = signal('');
  drawerOpen = signal(false);
  editing = signal<PluginCredentialItem | null>(null);
  saving = signal(false);
  testing = signal(false);
  confirmDelete = signal<PluginCredentialItem | null>(null);

  private currentState: PathListState | null = null;

  ngOnInit(): void {
    const scope = this.route.snapshot.data['scope'] as PluginCredentialScope | undefined;
    this.scopeSignal.set(scope ?? PluginCredentialScope.TENANT);
    const listPath = this.supportsEdit() ? '/platform/plugin-credentials' : '/settings/plugin-credentials';
    this.load();
    this.listState.bind(listPath, (state) => this.applyState(state));
  }

  private credentials(): Observable<ApiResponse<{ items: PluginCredentialItem[] }>> {
    return this.supportsEdit() ? this.platformService.credentials() : this.tenantService.credentials();
  }

  private applyState(state: PathListState): void {
    this.currentState = state;
    this.applySelection(state);
  }

  private applySelection(state: PathListState): void {
    const id = state.id;
    const match = id ? this.items().find((entry) => entry.id === id) ?? null : null;
    const edit = this.supportsEdit() && state.mode === 'edit';
    this.drawerOpen.set(state.mode === 'create' || edit);
    this.editing.set(edit ? match : null);
    this.confirmDelete.set(state.mode === 'delete' ? match : null);
  }

  updateState(patch: Partial<PathListState>): void {
    this.listState.set(patch);
  }

  closeDrawer(): void {
    this.updateState({ mode: 'list', id: null });
  }

  load(): void {
    this.loading.set(true);
    this.credentials().subscribe({
      next: (response) => {
        this.items.set(response.data?.items ?? []);
        this.loading.set(false);
        if (this.currentState) {
          this.applySelection(this.currentState);
        }
      },
      error: (error: ApiErrorResponse) => {
        this.errorText.set(apiMessage(this.i18n, error));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.saving.set(false);
    this.updateState({ mode: 'create', id: null });
  }

  openEdit(item: PluginCredentialItem): void {
    this.editing.set(item);
    this.saving.set(false);
    this.updateState({ mode: 'edit', id: item.id });
  }

  submit(payload: PluginCredentialPayload): void {
    const current = this.editing();
    this.saving.set(true);
    const request = current
      ? this.platformService.updateCredential(current.id, payload)
      : this.supportsEdit()
        ? this.platformService.createCredential(payload)
        : this.tenantService.createCredential(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.updateState({ mode: 'list', id: null });
        this.successText.set(this.i18n.t(current ? 'PLUGIN_CREDENTIAL_UPDATED' : 'PLUGIN_CREDENTIAL_CREATED'));
        this.load();
      },
      error: (error: ApiErrorResponse) => {
        this.saving.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  test(item: PluginCredentialItem): void {
    this.runTest(item.id);
  }

  testCurrent(): void {
    const id = this.editing()?.id;
    if (id) {
      this.runTest(id);
    }
  }

  private runTest(id: string): void {
    this.testing.set(true);
    const request = this.supportsEdit()
      ? this.platformService.testCredential(id)
      : this.tenantService.testCredential(id);
    request.subscribe({
      next: () => {
        this.testing.set(false);
        this.successText.set(this.i18n.t('PLUGIN_CREDENTIAL_TEST_SUCCESS'));
        this.load();
      },
      error: (error: ApiErrorResponse) => {
        this.testing.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  removeConfirmed(): void {
    const item = this.confirmDelete();
    if (!item) {
      return;
    }
    const request = this.supportsEdit()
      ? this.platformService.deleteCredential(item.id)
      : this.tenantService.deleteCredential(item.id);
    request.subscribe({
      next: () => {
        this.updateState({ mode: 'list', id: null });
        this.successText.set(this.i18n.t('PLUGIN_CREDENTIAL_DELETED'));
        this.load();
      },
      error: (error: ApiErrorResponse) => {
        this.updateState({ mode: 'list', id: null });
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  connectedLabel(item: PluginCredentialItem): string {
    if (item.connected === true) {
      return this.i18n.t('PLUGIN_CREDENTIAL_CONNECTED');
    }
    if (item.connected === false) {
      return this.i18n.t('PLUGIN_CREDENTIAL_UNREACHABLE');
    }
    return this.i18n.t('PLUGIN_CREDENTIAL_UNKNOWN');
  }
}
