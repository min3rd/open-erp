import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BadgeComponent,
  Branch,
  BranchAssignment,
  DrawerComponent,
  RequirePermissionDirective,
  SelectOption,
  SharpButtonComponent,
  SharpSelectComponent,
  SharpToggleComponent,
  TranslatePipe,
} from '@shared';
import { OrgService, OrgUser } from './org.service';

@Component({
  selector: 'app-org-branch-access',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    BadgeComponent,
    DrawerComponent,
    SharpButtonComponent,
    SharpSelectComponent,
    SharpToggleComponent,
    RequirePermissionDirective,
  ],
  templateUrl: './org-branch-access.component.html',
})
export class OrgBranchAccessComponent implements OnInit {
  private service = inject(OrgService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly items = signal<BranchAssignment[]>([]);
  readonly users = signal<OrgUser[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly drawerOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);

  form = { userId: '', branchId: '', isPrimary: false, canManage: true };

  readonly userOptions = computed<SelectOption[]>(() => this.users().map((item) => ({
    value: item.user_id,
    label: `${item.full_name || item.email} (${item.email})`,
  })));
  readonly branchOptions = computed<SelectOption[]>(() => this.branches().map((item) => ({
    value: item.id,
    label: `${item.code} - ${item.name}`,
  })));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getBranchAssignments().subscribe({
      next: (res) => { this.items.set(res.data?.items ?? []); this.loading.set(false); },
      error: (err) => { this.error.set(this.code(err)); this.loading.set(false); },
    });
    this.service.users().subscribe({
      next: (res) => this.users.set(res.data?.items ?? []),
      error: () => this.users.set([]),
    });
    this.service.getBranches().subscribe({
      next: (res) => this.branches.set(res.data?.items ?? []),
      error: () => this.branches.set([]),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = {
      userId: '',
      branchId: this.branches()[0]?.id ?? '',
      isPrimary: false,
      canManage: true,
    };
    this.drawerOpen.set(true);
  }

  openEdit(item: BranchAssignment): void {
    this.editingId.set(item.id);
    this.form = {
      userId: item.user_id,
      branchId: item.branch_id,
      isPrimary: item.is_primary,
      canManage: item.can_manage,
    };
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  save(): void {
    if (!this.form.userId || !this.form.branchId || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const editingId = this.editingId();
    const request = editingId
      ? this.service.updateBranchAssignment(editingId, {
        user_id: this.form.userId,
        branch_id: this.form.branchId,
        is_primary: this.form.isPrimary,
        can_manage: this.form.canManage,
      })
      : this.service.createBranchAssignment({
        user_id: this.form.userId,
        branch_id: this.form.branchId,
        is_primary: this.form.isPrimary,
        can_manage: this.form.canManage,
      });
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawerOpen.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(this.code(err));
      },
    });
  }

  remove(item: BranchAssignment): void {
    this.service.deleteBranchAssignment(item.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(this.code(err)),
    });
  }

  userName(item: BranchAssignment): string {
    return item.user_email || item.user_id;
  }

  private code(err: unknown): string {
    return (err as { error?: { code?: string } })?.error?.code || 'COMMON_LOAD_ERROR';
  }
}
