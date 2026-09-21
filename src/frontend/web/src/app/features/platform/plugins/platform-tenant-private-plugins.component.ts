import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  PluginCatalogItem,
  SharpButtonComponent,
  SharpToggleComponent,
  TranslatePipe,
  apiMessage,
} from '@shared';
import { PlatformPluginService } from '../../../core/services/platform-plugin.service';
import { AuthService } from '../../../core/services/auth.service';
import { PathListState, PathListStateService } from '../../../core/utils/path-list-state';

@Component({
  selector: 'app-platform-tenant-private-plugins',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DrawerComponent, SharpButtonComponent, SharpToggleComponent],
  providers: [PathListStateService],
  templateUrl: './platform-tenant-private-plugins.component.html',
})
export class PlatformTenantPrivatePluginsComponent implements OnInit {
  private service = inject(PlatformPluginService);
  private i18n = inject(I18nService);
  private listState = inject(PathListStateService);
  private auth = inject(AuthService);

  readonly isSuperAdmin = this.auth.isPlatformSuperAdmin;

  items = signal<PluginCatalogItem[]>([]);
  loading = signal(false);
  errorText = signal('');
  successText = signal('');

  blockOpen = signal(false);
  blockTarget = signal<PluginCatalogItem | null>(null);
  blockReason = signal('');
  blockForce = signal(false);
  blockConfirm = signal('');
  blockBusy = signal(false);

  private currentState: PathListState | null = null;

  ngOnInit(): void {
    this.load();
    this.listState.bind('/platform/tenant-private-plugins', (state) => this.applyState(state));
  }

  private applyState(state: PathListState): void {
    this.currentState = state;
    this.applySelection(state);
  }

  private applySelection(state: PathListState): void {
    const plugin = state.id;
    const match = plugin ? this.items().find((entry) => entry.plugin_key === plugin) ?? null : null;
    const canBlock = this.isSuperAdmin() && state.mode === 'block' && !!match;
    this.blockOpen.set(canBlock);
    this.blockTarget.set(canBlock ? match : null);
    if (state.mode === 'block' && !this.isSuperAdmin()) {
      this.updateState({ mode: 'list', id: null });
    }
  }

  private updateState(patch: Partial<PathListState>): void {
    this.listState.set(patch);
  }

  closeDrawer(): void {
    this.updateState({ mode: 'list', id: null });
  }

  load(): void {
    this.loading.set(true);
    this.service.tenantPrivatePlugins().subscribe({
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

  openBlock(item: PluginCatalogItem): void {
    this.blockReason.set('');
    this.blockForce.set(false);
    this.blockConfirm.set('');
    this.updateState({ mode: 'block', id: item.plugin_key });
  }

  canConfirm(): boolean {
    const target = this.blockTarget();
    return !!target && this.blockReason().trim().length > 0 && this.blockConfirm().trim() === target.plugin_key;
  }

  submitBlock(): void {
    const target = this.blockTarget();
    if (!target || !this.canConfirm()) {
      return;
    }
    this.blockBusy.set(true);
    this.service.blockTenantPrivate(target.plugin_key, {
      reason: this.blockReason(),
      scope: 'CATALOG',
      version: null,
      force_uninstall: this.blockForce(),
      confirmations: { affected_tenants: 0, confirm_text: this.blockConfirm() },
    }).subscribe({
      next: () => {
        this.blockBusy.set(false);
        this.updateState({ mode: 'list', id: null });
        this.successText.set(this.i18n.t('PLUGIN_BLOCK_SUCCESS'));
        this.load();
      },
      error: (error: ApiErrorResponse) => {
        this.blockBusy.set(false);
        this.errorText.set(apiMessage(this.i18n, error));
      },
    });
  }
}
