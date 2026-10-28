import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  SharpButtonComponent,
  SharpSelectComponent,
  TranslatePipe
} from '@shared';
import {
  CatalogAdminService,
  CatalogScope,
  CatalogSyncConflict,
  CatalogTypeDto
} from '../../core/services/catalog-admin.service';

const ACTIONS = ['SKIP', 'OVERRIDE', 'MERGE'] as const;

/**
 * FEAT-32 sync preview: one row per type/item/edge/relation conflict with an
 * OVERRIDE / SKIP / MERGE choice (default SKIP). Apply posts the chosen actions.
 */
@Component({
  selector: 'app-catalog-sync-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DrawerComponent, SharpButtonComponent, SharpSelectComponent, TranslatePipe],
  templateUrl: './catalog-sync-drawer.component.html'
})
export class CatalogSyncDrawerComponent {
  private catalog = inject(CatalogAdminService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  type = input<CatalogTypeDto | null>(null);
  scope = input<CatalogScope>(CatalogScope.TENANT);

  close = output<void>();
  applied = output<number>();

  readonly conflicts = signal<CatalogSyncConflict[]>([]);
  readonly actions = signal<Record<string, string>>({});
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorText = signal('');

  readonly actionOptions = ACTIONS.map((action) => ({
    value: action,
    labelKey: `CATALOG_SYNC_${action}`
  }));

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const type = this.type();
      if (!open || !type?.code) {
        return;
      }
      this.load(type.code);
    });
  }

  private load(code: string): void {
    this.loading.set(true);
    this.errorText.set('');
    this.conflicts.set([]);
    this.actions.set({});
    this.catalog.syncPreview(code, this.scope()).subscribe({
      next: (res) => {
        const list = res?.data?.conflicts ?? [];
        this.conflicts.set(list);
        const defaults: Record<string, string> = {};
        for (const conflict of list) {
          defaults[this.key(conflict)] = conflict.default_action || 'SKIP';
        }
        this.actions.set(defaults);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }

  key(conflict: CatalogSyncConflict): string {
    return `${conflict.scope}|${conflict.key}|${conflict.field ?? ''}`;
  }

  actionFor(conflict: CatalogSyncConflict): string {
    return this.actions()[this.key(conflict)] ?? 'SKIP';
  }

  setAction(conflict: CatalogSyncConflict, action: string): void {
    this.actions.update((map) => ({ ...map, [this.key(conflict)]: action }));
  }

  value(value: unknown): string {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  apply(): void {
    const type = this.type();
    if (!type?.code || this.saving()) {
      return;
    }
    const payload = this.conflicts().map((conflict) => ({
      scope: conflict.scope,
      key: conflict.key,
      field: conflict.field ?? null,
      action: (this.actionFor(conflict) as 'OVERRIDE' | 'SKIP' | 'MERGE')
    }));
    this.saving.set(true);
    this.errorText.set('');
    this.catalog.applySync(type.code, payload, this.scope()).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.applied.emit(res?.data?.applied ?? 0);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }
}
