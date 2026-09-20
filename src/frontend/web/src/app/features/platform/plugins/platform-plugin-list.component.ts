import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  OperationProgressComponent,
  PluginBulkPreview,
  PluginBulkReport,
  PluginCatalogDetail,
  PluginCatalogItem,
  PluginCredentialItem,
  PluginInstallationItem,
  PluginOperationStatus,
  PluginVersionItem,
  SharpButtonComponent,
  SharpToggleComponent,
  TranslatePipe,
  VersionTimelineComponent,
  apiMessage,
} from '@shared';
import { PlatformPluginService } from '../../../core/services/platform-plugin.service';

const TERMINAL_STATUSES = ['ACTIVE', 'INACTIVE', 'UNINSTALLED', 'INSTALL_FAILED', 'ROLLBACK_FAILED'];

@Component({
  selector: 'app-platform-plugin-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DrawerComponent,
    VersionTimelineComponent,
    OperationProgressComponent,
    SharpButtonComponent,
    SharpToggleComponent,
  ],
  templateUrl: './platform-plugin-list.component.html',
})
export class PlatformPluginListComponent implements OnInit, OnDestroy {
  private service = inject(PlatformPluginService);
  private i18n = inject(I18nService);

  items = signal<PluginCatalogItem[]>([]);
  total = signal(0);
  page = signal(0);
  size = 20;
  keyword = signal('');
  catalogStatus = signal('');
  loading = signal(false);
  errorText = signal('');
  successText = signal('');

  selectedKey = signal<string | null>(null);
  detail = signal<PluginCatalogDetail | null>(null);
  detailLoading = signal(false);

  installations = signal<PluginInstallationItem[]>([]);
  installationsTotal = signal(0);
  installationsPage = signal(0);

  operation = signal<PluginOperationStatus | null>(null);
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  registerOpen = signal(false);
  editingCatalog = signal(false);
  submitBusy = signal(false);
  catalogForm = signal({ plugin_key: '', name_key: '', description_key: '', default_install: false, locked: false });

  versionOpen = signal(false);
  versionSource = signal('DOCKER_HUB');
  versionBusy = signal(false);
  versionForm = signal({ version: '', image_ref: '', registry_url: '', repository: '', tag: '', checksum: '', artifact_ref: '', manifest_text: '' });
  credentials = signal<PluginCredentialItem[]>([]);
  credentialId = signal<string>('');
  uploadFile = signal<File | null>(null);
  uploadBusy = signal(false);
  uploadResult = signal<string>('');

  blockOpen = signal(false);
  blockScope = signal('CATALOG');
  blockVersion = signal<string | null>(null);
  blockReason = signal('');
  blockForce = signal(false);
  blockConfirm = signal('');
  blockPreview = signal<PluginBulkPreview | null>(null);
  blockBusy = signal(false);

  bulkOpen = signal(false);
  bulkVersion = signal('');
  bulkPreviewData = signal<PluginBulkPreview | null>(null);
  bulkReport = signal<PluginBulkReport | null>(null);
  bulkBusy = signal(false);

  supportOpen = signal(false);
  supportTenant = signal<PluginInstallationItem | null>(null);
  supportAction = signal('ENABLE');
  supportVersion = signal('');
  supportReason = signal('');
  supportBusy = signal(false);

  readonly supportActions = ['ENABLE', 'DISABLE', 'INSTALL', 'UNINSTALL', 'UPGRADE', 'ROLLBACK'];

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  load(): void {
    this.loading.set(true);
    this.errorText.set('');
    this.service.list({ page: this.page(), size: this.size, keyword: this.keyword(), catalog_status: this.catalogStatus() })
      .subscribe({
        next: (response) => {
          this.items.set(response.data?.items ?? []);
          this.total.set(response.data?.total_items ?? 0);
          this.loading.set(false);
        },
        error: (error: ApiErrorResponse) => {
          this.errorText.set(apiMessage(this.i18n, error));
          this.loading.set(false);
        },
      });
  }

  search(): void {
    this.page.set(0);
    this.load();
  }

  prevPage(): void {
    if (this.page() > 0) {
      this.page.update((value) => value - 1);
      this.load();
    }
  }

  nextPage(): void {
    if ((this.page() + 1) * this.size < this.total()) {
      this.page.update((value) => value + 1);
      this.load();
    }
  }

  select(item: PluginCatalogItem): void {
    this.selectedKey.set(item.plugin_key);
    this.reloadDetail();
  }

  reloadDetail(): void {
    const key = this.selectedKey();
    if (!key) {
      return;
    }
    this.detailLoading.set(true);
    this.service.detail(key).subscribe({
      next: (response) => {
        this.detail.set(response.data ?? null);
        this.detailLoading.set(false);
      },
      error: (error: ApiErrorResponse) => {
        this.errorText.set(apiMessage(this.i18n, error));
        this.detailLoading.set(false);
      },
    });
    this.loadInstallations(key, this.installationsPage());
  }

  loadInstallations(pluginKey: string, page: number): void {
    this.installationsPage.set(page);
    this.service.installations(pluginKey, page, this.size).subscribe({
      next: (response) => {
        this.installations.set(response.data?.items ?? []);
        this.installationsTotal.set(response.data?.total_items ?? 0);
      },
      error: () => this.installations.set([]),
    });
  }

  openRegister(): void {
    this.editingCatalog.set(false);
    this.catalogForm.set({ plugin_key: '', name_key: '', description_key: '', default_install: false, locked: false });
    this.registerOpen.set(true);
  }

  openEdit(): void {
    const current = this.detail();
    if (!current) {
      return;
    }
    this.editingCatalog.set(true);
    this.catalogForm.set({
      plugin_key: current.plugin_key,
      name_key: current.name_key,
      description_key: current.description_key,
      default_install: !!current.default_install,
      locked: !!current.locked,
    });
    this.registerOpen.set(true);
  }

  submitCatalog(): void {
    const form = this.catalogForm();
    if (!form.name_key || (!this.editingCatalog() && !form.plugin_key)) {
      return;
    }
    this.submitBusy.set(true);
    const request = this.editingCatalog()
      ? this.service.updateCatalog(form.plugin_key, {
          name_key: form.name_key,
          description_key: form.description_key,
          default_install: form.default_install,
          locked: form.locked,
        })
      : this.service.createCatalog({
          plugin_key: form.plugin_key,
          name_key: form.name_key,
          description_key: form.description_key,
          default_install: form.default_install,
          locked: form.locked,
        });
    request.subscribe({
      next: () => {
        this.submitBusy.set(false);
        this.registerOpen.set(false);
        this.successText.set(this.i18n.t('PLUGIN_METADATA_UPDATE_SUCCESS'));
        this.load();
      },
      error: (error: ApiErrorResponse) => {
        this.submitBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  deleteCatalog(): void {
    const key = this.selectedKey();
    if (!key) {
      return;
    }
    this.service.deleteCatalog(key).subscribe({
      next: () => {
        this.successText.set(this.i18n.t('PLUGIN_CATALOG_DELETE_SUCCESS'));
        this.selectedKey.set(null);
        this.detail.set(null);
        this.load();
      },
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }

  versionAction(version: string, action: string): void {
    const key = this.selectedKey();
    if (!key) {
      return;
    }
    this.service.versionAction(key, version, action, 'platform portal').subscribe({
      next: () => {
        this.successText.set(this.i18n.t('PLUGIN_VERSION_DELETE_SUCCESS'));
        this.reloadDetail();
      },
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }

  unblockVersion(version: string): void {
    const key = this.selectedKey();
    if (!key) {
      return;
    }
    this.service.unblockVersion(key, version, 'platform portal').subscribe({
      next: () => this.reloadDetail(),
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }

  openVersion(): void {
    this.versionForm.set({ version: '', image_ref: '', registry_url: '', repository: '', tag: '', checksum: '', artifact_ref: '', manifest_text: '' });
    this.uploadResult.set('');
    this.uploadFile.set(null);
    this.credentialId.set('');
    this.service.credentials().subscribe({
      next: (response) => this.credentials.set(response.data?.items ?? []),
      error: () => this.credentials.set([]),
    });
    this.versionOpen.set(true);
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
        this.versionForm.update((form) => ({ ...form, artifact_ref: result?.artifact_ref ?? '', checksum: result?.checksum ?? '' }));
      },
      error: (error: ApiErrorResponse) => {
        this.uploadBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  submitVersion(): void {
    const key = this.selectedKey();
    const form = this.versionForm();
    if (!key || !form.version) {
      return;
    }
    this.versionBusy.set(true);
    let manifest: unknown = undefined;
    if (form.manifest_text.trim()) {
      try {
        manifest = JSON.parse(form.manifest_text);
      } catch {
        this.versionBusy.set(false);
        this.errorText.set(this.i18n.t('PLUGIN_ARTIFACT_INVALID_MANIFEST'));
        return;
      }
    }
    this.service.registerVersion(key, {
      source: this.versionSource(),
      version: form.version,
      image_ref: form.image_ref || undefined,
      registry_url: form.registry_url || undefined,
      repository: form.repository || undefined,
      tag: form.tag || undefined,
      checksum: form.checksum || undefined,
      artifact_ref: form.artifact_ref || undefined,
      credential_id: this.credentialId() || undefined,
      manifest,
    }).subscribe({
      next: () => {
        this.versionBusy.set(false);
        this.versionOpen.set(false);
        this.successText.set(this.i18n.t('PLUGIN_VERSION_ADD_SUCCESS'));
        this.reloadDetail();
      },
      error: (error: ApiErrorResponse) => {
        this.versionBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  openBlock(scope: string, version?: string): void {
    this.blockScope.set(scope);
    this.blockVersion.set(version ?? null);
    this.blockReason.set('');
    this.blockForce.set(false);
    this.blockConfirm.set('');
    this.blockPreview.set(null);
    const key = this.selectedKey();
    if (key && scope === 'CATALOG') {
      this.service.bulkPreview(key).subscribe({
        next: (response) => this.blockPreview.set(response.data ?? null),
        error: () => this.blockPreview.set(null),
      });
    } else {
      this.blockPreview.set({ total: this.installationsTotal(), tenant_ids: [] });
    }
    this.blockOpen.set(true);
  }

  canConfirmBlock(): boolean {
    const key = this.selectedKey();
    return !!key && this.blockReason().trim().length > 0 && this.blockConfirm().trim() === key;
  }

  submitBlock(): void {
    const key = this.selectedKey();
    if (!key || !this.canConfirmBlock()) {
      return;
    }
    this.blockBusy.set(true);
    this.service.blockCatalog(key, {
      reason: this.blockReason(),
      scope: this.blockScope(),
      version: this.blockVersion(),
      force_uninstall: this.blockForce(),
      confirmations: {
        affected_tenants: this.blockPreview()?.total ?? 0,
        confirm_text: this.blockConfirm(),
      },
    }).subscribe({
      next: (response) => {
        this.blockBusy.set(false);
        this.blockOpen.set(false);
        this.successText.set(this.i18n.t('PLUGIN_BLOCK_SUCCESS'));
        this.handleOperation(response.data ?? null);
        this.reloadDetail();
      },
      error: (error: ApiErrorResponse) => {
        this.blockBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  unblockCatalog(): void {
    const key = this.selectedKey();
    if (!key) {
      return;
    }
    this.service.unblockCatalog(key, 'platform portal').subscribe({
      next: () => {
        this.successText.set(this.i18n.t('PLUGIN_UNBLOCK_SUCCESS'));
        this.reloadDetail();
      },
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }

  openBulk(): void {
    this.bulkVersion.set('');
    this.bulkPreviewData.set(null);
    this.bulkReport.set(null);
    this.bulkOpen.set(true);
  }

  previewBulk(): void {
    const key = this.selectedKey();
    if (!key) {
      return;
    }
    this.bulkBusy.set(true);
    this.service.bulkPreview(key).subscribe({
      next: (response) => {
        this.bulkBusy.set(false);
        this.bulkPreviewData.set(response.data ?? null);
      },
      error: (error: ApiErrorResponse) => {
        this.bulkBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  applyBulk(): void {
    const key = this.selectedKey();
    const preview = this.bulkPreviewData();
    if (!key || !preview || !this.bulkVersion()) {
      return;
    }
    this.bulkBusy.set(true);
    this.service.bulkApply(key, {
      preview_token: key,
      version: this.bulkVersion(),
      tenant_ids: preview.tenant_ids,
    }).subscribe({
      next: (response) => {
        this.bulkBusy.set(false);
        this.bulkReport.set(response.data ?? null);
        this.load();
      },
      error: (error: ApiErrorResponse) => {
        this.bulkBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  openSupport(tenant: PluginInstallationItem): void {
    this.supportTenant.set(tenant);
    this.supportAction.set('ENABLE');
    this.supportVersion.set('');
    this.supportReason.set('');
    this.supportOpen.set(true);
  }

  submitSupport(): void {
    const key = this.selectedKey();
    const tenant = this.supportTenant();
    if (!key || !tenant || !this.supportReason().trim()) {
      return;
    }
    this.supportBusy.set(true);
    this.service.supportAction(key, tenant.tenant_id, this.supportAction().toLowerCase(),
      this.supportVersion() || null, this.supportReason()).subscribe({
      next: (response) => {
        this.supportBusy.set(false);
        this.supportOpen.set(false);
        this.successText.set(this.i18n.t('PLUGIN_OPERATION_STARTED'));
        this.handleOperation(response.data ?? null);
      },
      error: (error: ApiErrorResponse) => {
        this.supportBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  grantEntitlement(tenant: PluginInstallationItem): void {
    const key = this.selectedKey();
    if (!key) {
      return;
    }
    this.service.grantEntitlement(tenant.tenant_id, key).subscribe({
      next: () => this.loadInstallations(key, this.installationsPage()),
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }

  revokeEntitlement(tenant: PluginInstallationItem): void {
    const key = this.selectedKey();
    if (!key) {
      return;
    }
    this.service.revokeEntitlement(tenant.tenant_id, key).subscribe({
      next: () => this.loadInstallations(key, this.installationsPage()),
      error: (error: ApiErrorResponse) => this.errorText.set(apiMessage(this.i18n, error)),
    });
  }

  versionOptions(): PluginVersionItem[] {
    return this.detail()?.version ?? [];
  }

  dismissMessages(): void {
    this.errorText.set('');
    this.successText.set('');
  }

  private handleOperation(operation: PluginOperationStatus | null): void {
    if (!operation?.operation_id) {
      return;
    }
    this.operation.set(operation);
    if (!TERMINAL_STATUSES.includes(operation.status)) {
      this.startPolling(operation.operation_id);
    }
  }

  private startPolling(operationId: string): void {
    this.stopPolling();
    this.pollHandle = setInterval(() => {
      this.service.operation(operationId).subscribe({
        next: (response) => {
          const operation = response.data ?? null;
          this.operation.set(operation);
          if (operation && TERMINAL_STATUSES.includes(operation.status)) {
            this.stopPolling();
            this.reloadDetail();
          }
        },
        error: () => this.stopPolling(),
      });
    }, 1500);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }
}
