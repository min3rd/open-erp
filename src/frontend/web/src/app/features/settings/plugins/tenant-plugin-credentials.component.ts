import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {
  ApiErrorResponse,
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

@Component({
  selector: 'app-tenant-plugin-credentials',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DrawerComponent, CredentialFormComponent, SharpButtonComponent],
  templateUrl: './tenant-plugin-credentials.component.html',
})
export class TenantPluginCredentialsComponent implements OnInit {
  private service = inject(PluginService);
  private i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  items = signal<PluginCredentialItem[]>([]);
  loading = signal(false);
  errorText = signal('');
  successText = signal('');
  drawerOpen = signal(false);
  saving = signal(false);
  testing = signal(false);
  confirmDelete = signal<PluginCredentialItem | null>(null);

  readonly tenantScope = PluginCredentialScope.TENANT;

  ngOnInit(): void {
    this.load();
    this.route.queryParamMap.subscribe((params) => this.applyQuery(params));
  }

  private applyQuery(params: ParamMap): void {
    const drawer = params.get('drawer');
    const id = params.get('id');
    const match = id ? this.items().find((entry) => entry.id === id) ?? null : null;
    this.drawerOpen.set(drawer === 'create');
    this.confirmDelete.set(drawer === 'delete' ? match : null);
  }

  setQuery(partial: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: partial,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  closeDrawer(): void {
    this.setQuery({ drawer: null, id: null });
  }

  load(): void {
    this.loading.set(true);
    this.service.credentials().subscribe({
      next: (response) => {
        this.items.set(response.data?.items ?? []);
        this.loading.set(false);
        this.applyQuery(this.route.snapshot.queryParamMap);
      },
      error: (error: ApiErrorResponse) => {
        this.errorText.set(apiMessage(this.i18n, error));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.saving.set(false);
    this.setQuery({ drawer: 'create', id: null });
  }

  submit(payload: PluginCredentialPayload): void {
    this.saving.set(true);
    this.service.createCredential(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.setQuery({ drawer: null, id: null });
        this.successText.set(this.i18n.t('PLUGIN_CREDENTIAL_CREATED'));
        this.load();
      },
      error: (error: ApiErrorResponse) => {
        this.saving.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }

  test(item: PluginCredentialItem): void {
    this.testing.set(true);
    this.service.testCredential(item.id).subscribe({
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
    this.service.deleteCredential(item.id).subscribe({
      next: () => {
        this.setQuery({ drawer: null, id: null });
        this.successText.set(this.i18n.t('PLUGIN_CREDENTIAL_DELETED'));
        this.load();
      },
      error: (error: ApiErrorResponse) => {
        this.setQuery({ drawer: null, id: null });
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
