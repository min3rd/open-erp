import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  ListData,
  Role,
  SharpButtonComponent,
  SharpToggleComponent,
  TranslatePipe
} from '@shared';
import {
  CatalogAdminService,
  CatalogGrantPayload,
  CatalogTypeDto
} from '../../core/services/catalog-admin.service';
import { ApiService } from '@shared';

interface GrantRow {
  role: Role;
  can_read: boolean;
  can_write: boolean;
}

/**
 * Per-type role grants (DES-UI-S05-001 §2, AC-09): role × [read/write] matrix
 * reusing the `role-matrix` layout language. Missing grants default to denied
 * so saving can never silently escalate access.
 */
@Component({
  selector: 'app-catalog-grants-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DrawerComponent, SharpButtonComponent, SharpToggleComponent, TranslatePipe],
  templateUrl: './catalog-grants-drawer.component.html'
})
export class CatalogGrantsDrawerComponent {
  private catalog = inject(CatalogAdminService);
  private api = inject(ApiService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  type = input<CatalogTypeDto | null>(null);

  close = output<void>();
  saved = output<string>();

  readonly roles = signal<Role[]>([]);
  readonly grants = signal<Record<string, { can_read: boolean; can_write: boolean }>>({});
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly errorText = signal('');

  readonly rows = computed<GrantRow[]>(() =>
    this.roles().map((role) => ({
      role,
      can_read: this.grants()[role.id]?.can_read ?? false,
      can_write: this.grants()[role.id]?.can_write ?? false
    }))
  );

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const type = this.type();
      if (!open || !type) {
        return;
      }
      this.errorText.set('');
      this.load(type.code);
    });
  }

  private load(typeCode: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.get<ListData<Role>>('/api/v1/iam/roles').subscribe({
      next: (rolesRes) => {
        this.roles.set(rolesRes.data?.items ?? []);
        this.catalog.getGrants(typeCode).subscribe({
          next: (grantsRes) => {
            const map: Record<string, { can_read: boolean; can_write: boolean }> = {};
            for (const grant of grantsRes.data?.items ?? []) {
              map[grant.role_id] = { can_read: grant.can_read, can_write: grant.can_write };
            }
            this.grants.set(map);
            this.loading.set(false);
          },
          error: (err) => {
            this.loading.set(false);
            this.loadError.set(true);
            this.showError(err);
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(true);
        this.showError(err);
      }
    });
  }

  retry(): void {
    const type = this.type();
    if (type) {
      this.load(type.code);
    }
  }

  setRead(roleId: string, checked: boolean): void {
    this.grants.update((map) => ({
      ...map,
      [roleId]: { can_read: checked, can_write: checked ? map[roleId]?.can_write ?? false : false }
    }));
  }

  setWrite(roleId: string, checked: boolean): void {
    this.grants.update((map) => ({
      ...map,
      [roleId]: { can_read: checked ? true : map[roleId]?.can_read ?? false, can_write: checked }
    }));
  }

  save(): void {
    const type = this.type();
    if (!type || this.saving() || this.loading() || this.loadError()) {
      return;
    }
    const payload: CatalogGrantPayload[] = this.rows().map((row) => ({
      role_id: row.role.id,
      can_read: row.can_read,
      can_write: row.can_write
    }));
    this.saving.set(true);
    this.errorText.set('');
    this.catalog.replaceGrants(type.code, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.saved.emit(res.code);
      },
      error: (err) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  private showError(err: unknown): void {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
