import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BadgeComponent,
  Branch,
  DepartmentNode,
  DrawerComponent,
  Membership,
  RequirePermissionDirective,
  SelectOption,
  SharpButtonComponent,
  SharpSelectComponent,
  SharpToggleComponent,
  TranslatePipe,
  flattenDepartments,
} from '@shared';
import { OrgService, OrgUser } from './org.service';

@Component({
  selector: 'app-org-members',
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
  templateUrl: './org-members.component.html',
})
export class OrgMembersComponent implements OnInit {
  private service = inject(OrgService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly members = signal<Membership[]>([]);
  readonly users = signal<OrgUser[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly departments = signal<DepartmentNode[]>([]);
  readonly drawerOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);

  form = { userId: '', branchId: '', departmentId: '', managerUserId: '', isPrimary: true };

  readonly flatDepartments = computed(() => flattenDepartments(this.departments()));
  readonly userOptions = computed<SelectOption[]>(() => this.users().map((item) => ({
    value: item.user_id,
    label: `${item.full_name || item.email} (${item.email})`,
  })));
  readonly branchOptions = computed<SelectOption[]>(() => this.branches().map((item) => ({
    value: item.id,
    label: `${item.code} - ${item.name}`,
  })));
  readonly departmentOptions = computed<SelectOption[]>(() => this.flatDepartments()
    .filter((item) => !this.form.branchId || item.branch_id === this.form.branchId)
    .map((item) => ({ value: item.id, label: `${'-- '.repeat(item.depth)}${item.name}` })));
  readonly managerOptions = computed<SelectOption[]>(() => [
    { value: '', labelKey: 'ORGANIZATION_USER_ASSIGN_NO_MANAGER' },
    ...this.userOptions(),
  ]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getMemberships().subscribe({
      next: (res) => { this.members.set(res.data?.items ?? []); this.loading.set(false); },
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
    this.service.getDepartmentTree().subscribe({
      next: (res) => this.departments.set(res.data?.items ?? []),
      error: () => this.departments.set([]),
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = {
      userId: '',
      branchId: this.branches()[0]?.id ?? '',
      departmentId: '',
      managerUserId: '',
      isPrimary: true,
    };
    this.syncDepartment();
    this.drawerOpen.set(true);
  }

  openEdit(item: Membership): void {
    this.editingId.set(item.id);
    this.form = {
      userId: item.user_id,
      branchId: item.branch_id ?? '',
      departmentId: item.department_id ?? '',
      managerUserId: item.direct_manager_user_id ?? '',
      isPrimary: item.is_primary ?? true,
    };
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  onBranchChange(branchId: string): void {
    this.form.branchId = branchId;
    this.syncDepartment();
  }

  save(): void {
    if (!this.form.userId || !this.form.branchId || !this.form.departmentId || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const payload = {
      user_id: this.form.userId,
      branch_id: this.form.branchId,
      department_id: this.form.departmentId,
      direct_manager_user_id: this.form.managerUserId || null,
      is_primary: this.form.isPrimary,
    };
    const editingId = this.editingId();
    const request = editingId
      ? this.service.updateMembership(editingId, payload)
      : this.service.createMembership(payload);
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

  remove(item: Membership): void {
    this.service.deleteMembership(item.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(this.code(err)),
    });
  }

  userName(item: Membership): string {
    return item.user_full_name || item.user_email || item.user_id;
  }

  private syncDepartment(): void {
    const allowed = this.departmentOptions();
    if (!allowed.some((item) => item.value === this.form.departmentId)) {
      this.form.departmentId = allowed[0]?.value ?? '';
    }
  }

  private code(err: unknown): string {
    return (err as { error?: { code?: string } })?.error?.code || 'COMMON_LOAD_ERROR';
  }
}
