import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  TreeViewComponent,
  ModalComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent,
  IconComponent,
  ToastService,
  TreeNode,
  GuideTourComponent,
  TourStep
} from '@open-erp/shared';

@Component({
  selector: 'app-org-structure',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslocoPipe,
    TreeViewComponent,
    ModalComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    IconComponent,
    GuideTourComponent
  ],
  templateUrl: './org-structure.component.html',
  styleUrls: ['./org-structure.component.css']
})
export class OrgStructureComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly translocoService = inject(TranslocoService);
  private readonly toastService = inject(ToastService);

  // Data Signals
  branches = signal<any[]>([]);
  departmentsTree = signal<TreeNode[]>([]);
  departmentsFlat = signal<any[]>([]);
  users = signal<any[]>([]);
  selectedNode = signal<{ type: 'branch' | 'department'; data: any } | null>(null);
  selectedNodeEmployees = signal<any[]>([]);

  // Modal State Signals
  isBranchModalOpen = signal<boolean>(false);
  isDepartmentModalOpen = signal<boolean>(false);
  isInviteModalOpen = signal<boolean>(false);
  editingBranch = signal<any | null>(null);
  editingDepartment = signal<any | null>(null);

  showGuide = signal<boolean>(false);

  steps: TourStep[] = [
    {
      title: 'guide.org_branches_title',
      description: 'guide.org_branches_desc',
      selector: '#branches-section'
    },
    {
      title: 'guide.org_depts_title',
      description: 'guide.org_depts_desc',
      selector: '#depts-section'
    },
    {
      title: 'guide.org_seed_title',
      description: 'guide.org_seed_desc',
      selector: '#seed-section'
    },
    {
      title: 'guide.org_details_title',
      description: 'guide.org_details_desc',
      selector: '#details-section'
    }
  ];

  triggerGuide() {
    this.showGuide.set(true);
  }

  // Seeding Signals & Controls
  industryControl = new FormControl('');
  selectedIndustry = signal<string>('');
  industryOptions = computed(() => [
    { value: '', label: this.translocoService.translate('org.select_industry') },
    { value: 'technology', label: this.translocoService.translate('org.industry_technology') },
    { value: 'retail', label: this.translocoService.translate('org.industry_retail') },
    { value: 'manufacturing', label: this.translocoService.translate('org.industry_manufacturing') },
    { value: 'services', label: this.translocoService.translate('org.industry_services') }
  ]);

  // Forms
  branchForm!: FormGroup;
  departmentForm!: FormGroup;
  inviteForm!: FormGroup;
  roles = signal<any[]>([]);

  // Active Node ID helper
  activeNodeId = computed(() => {
    const selected = this.selectedNode();
    return selected?.type === 'department' ? selected.data.id : null;
  });

  // Select dropdown options helpers
  parentDeptOptions = computed(() => {
    const list = this.departmentsFlat()
      .filter(d => !this.editingDepartment() || d.id !== this.editingDepartment().id)
      .map(d => ({ value: d.id, label: d.name }));
    
    // Add "None (Top Level)" option
    return [{ value: '', label: this.translocoService.translate('org.no_parent') }, ...list];
  });

  branchOptions = computed(() => {
    const list = this.branches().map(b => ({ value: b.id, label: b.name }));
    return [{ value: '', label: this.translocoService.translate('org.no_parent') }, ...list];
  });

  managerOptions = computed(() => {
    const list = this.users().map(u => ({ value: u.id, label: u.email }));
    return [{ value: '', label: this.translocoService.translate('org.no_parent') }, ...list];
  });

  deptOptions = computed(() => {
    const list = this.departmentsFlat().map(d => ({ value: d.id, label: d.name }));
    return [{ value: '', label: this.translocoService.translate('org.select_department') }, ...list];
  });

  roleOptions = computed(() => {
    const list = this.roles().map(r => ({ value: r.id, label: r.name }));
    return [{ value: '', label: this.translocoService.translate('org.select_role') }, ...list];
  });

  ngOnInit(): void {
    this.initForms();
    this.loadData();
    this.industryControl.valueChanges.subscribe((val) => {
      this.selectedIndustry.set(val || '');
    });

    const seen = localStorage.getItem('guide_seen_org-structure');
    if (seen !== 'true') {
      setTimeout(() => {
        this.showGuide.set(true);
      }, 500);
    }
  }

  getBranchControl(name: string): FormControl {
    return this.branchForm.get(name) as FormControl;
  }

  getDeptControl(name: string): FormControl {
    return this.departmentForm.get(name) as FormControl;
  }

  getInviteControl(name: string): FormControl {
    return this.inviteForm.get(name) as FormControl;
  }

  private initForms(): void {
    this.branchForm = this.fb.group({
      name: ['', [Validators.required]],
      address: [''],
      phone: [''],
      email: ['', [Validators.email]]
    });

    this.departmentForm = this.fb.group({
      name: ['', [Validators.required]],
      parentId: [''],
      branchId: [''],
      managerId: ['']
    });

    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      departmentId: [''],
      roleId: ['']
    });
  }

  loadData(): void {
    // 1. Load Branches
    this.http.get<any>('/api/v1/org/branches').subscribe({
      next: (res) => {
        if (res.success) {
          this.branches.set(res.data || []);
        }
      }
    });

    // 2. Load Departments Tree
    this.http.get<any>('/api/v1/org/departments').subscribe({
      next: (res) => {
        if (res.success) {
          this.departmentsTree.set(res.data || []);
        }
      }
    });

    // 3. Load Departments Flat
    this.http.get<any>('/api/v1/org/departments/flat').subscribe({
      next: (res) => {
        if (res.success) {
          this.departmentsFlat.set(res.data || []);
        }
      }
    });

    // 4. Load Users (for manager select)
    this.http.get<any>('/api/v1/org/departments/users').subscribe({
      next: (res) => {
        if (res.success) {
          this.users.set(res.data || []);
        }
      }
    });

    // 5. Load Roles
    this.http.get<any>('/api/v1/auth/roles').subscribe({
      next: (res) => {
        if (res.success) {
          this.roles.set(res.data || []);
        }
      }
    });
  }

  selectNode(node: TreeNode): void {
    this.selectedNode.set({ type: 'department', data: node });
    this.loadEmployees(node.id);
  }

  selectBranch(branch: any): void {
    this.selectedNode.set({ type: 'branch', data: branch });
    this.selectedNodeEmployees.set([]); // Branches don't directly list employees in this view
  }

  private loadEmployees(deptId: string): void {
    this.http.get<any>(`/api/v1/org/departments/${deptId}/employees`).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedNodeEmployees.set(res.data || []);
        }
      }
    });
  }

  // Drag and Drop Update
  onNodeDropped(event: { nodeId: string; targetParentId: string | null }): void {
    const parentIdVal = event.targetParentId === '' ? null : event.targetParentId;
    this.http.patch<any>(`/api/v1/org/departments/${event.nodeId}`, { parentId: parentIdVal }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess(this.translocoService.translate('org.department_updated'));
          this.loadData();
          // If the updated node is the currently selected one, refresh it
          const current = this.selectedNode();
          if (current && current.type === 'department' && current.data.id === event.nodeId) {
            this.selectedNode.set({ type: 'department', data: res.data });
          }
        }
      },
      error: (err) => {
        const errorKey = err.error?.error?.messageKey || 'validation.error_occurred';
        this.toastService.showError(this.translocoService.translate(errorKey));
      }
    });
  }

  // Branch CRUD
  openAddBranch(): void {
    this.editingBranch.set(null);
    this.branchForm.reset();
    this.isBranchModalOpen.set(true);
  }

  openEditBranch(branch: any): void {
    this.editingBranch.set(branch);
    this.branchForm.setValue({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || ''
    });
    this.isBranchModalOpen.set(true);
  }

  saveBranch(): void {
    if (this.branchForm.invalid) return;
    const body = this.branchForm.value;
    const editing = this.editingBranch();

    if (editing) {
      this.http.patch<any>(`/api/v1/org/branches/${editing.id}`, body).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.showSuccess(this.translocoService.translate('org.branch_updated'));
            this.isBranchModalOpen.set(false);
            this.loadData();
            const current = this.selectedNode();
            if (current && current.type === 'branch' && current.data.id === editing.id) {
              this.selectedNode.set({ type: 'branch', data: res.data });
            }
          }
        }
      });
    } else {
      this.http.post<any>('/api/v1/org/branches', body).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.showSuccess(this.translocoService.translate('org.branch_created'));
            this.isBranchModalOpen.set(false);
            this.loadData();
          }
        }
      });
    }
  }

  deleteBranch(id: string): void {
    if (!confirm(this.translocoService.translate('org.delete_confirm'))) return;

    this.http.delete<any>(`/api/v1/org/branches/${id}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess(this.translocoService.translate('org.branch_deleted'));
          this.selectedNode.set(null);
          this.loadData();
        }
      }
    });
  }

  // Department CRUD
  openAddDepartment(): void {
    this.editingDepartment.set(null);
    this.departmentForm.reset({
      name: '',
      parentId: '',
      branchId: '',
      managerId: ''
    });
    this.isDepartmentModalOpen.set(true);
  }

  openEditDepartment(dept: any): void {
    this.editingDepartment.set(dept);
    this.departmentForm.setValue({
      name: dept.name,
      parentId: dept.parentId || '',
      branchId: dept.branchId || '',
      managerId: dept.managerId || ''
    });
    this.isDepartmentModalOpen.set(true);
  }

  saveDepartment(): void {
    if (this.departmentForm.invalid) return;
    const body = this.departmentForm.value;
    
    // Clean up empty selects to null
    const cleanedBody = {
      name: body.name,
      parentId: body.parentId === '' ? null : body.parentId,
      branchId: body.branchId === '' ? null : body.branchId,
      managerId: body.managerId === '' ? null : body.managerId
    };

    const editing = this.editingDepartment();

    if (editing) {
      this.http.patch<any>(`/api/v1/org/departments/${editing.id}`, cleanedBody).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.showSuccess(this.translocoService.translate('org.department_updated'));
            this.isDepartmentModalOpen.set(false);
            this.loadData();
            const current = this.selectedNode();
            if (current && current.type === 'department' && current.data.id === editing.id) {
              this.selectedNode.set({ type: 'department', data: res.data });
            }
          }
        },
        error: (err) => {
          const errorKey = err.error?.error?.messageKey || 'validation.error_occurred';
          this.toastService.showError(this.translocoService.translate(errorKey));
        }
      });
    } else {
      this.http.post<any>('/api/v1/org/departments', cleanedBody).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.showSuccess(this.translocoService.translate('org.department_created'));
            this.isDepartmentModalOpen.set(false);
            this.loadData();
          }
        },
        error: (err) => {
          const errorKey = err.error?.error?.messageKey || 'validation.error_occurred';
          this.toastService.showError(this.translocoService.translate(errorKey));
        }
      });
    }
  }

  deleteDepartment(id: string): void {
    if (!confirm(this.translocoService.translate('org.delete_confirm'))) return;

    this.http.delete<any>(`/api/v1/org/departments/${id}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess(this.translocoService.translate('org.department_deleted'));
          this.selectedNode.set(null);
          this.loadData();
        }
      },
      error: (err) => {
        const errorKey = err.error?.error?.messageKey || 'validation.error_occurred';
        this.toastService.showError(this.translocoService.translate(errorKey));
      }
    });
  }

  seedData(): void {
    const industry = this.industryControl.value;
    if (!industry) return;

    this.http.post<any>('/api/v1/org/departments/seed', { industry }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess(this.translocoService.translate('org.department_created'));
          this.industryControl.reset('');
          this.loadData();
        }
      },
      error: (err) => {
        const errorKey = err.error?.error?.messageKey || 'validation.error_occurred';
        this.toastService.showError(this.translocoService.translate(errorKey));
      }
    });
  }

  openInviteModal(): void {
    this.inviteForm.reset({
      email: '',
      firstName: '',
      lastName: '',
      departmentId: this.selectedNode()?.type === 'department' ? this.selectedNode()?.data.id : '',
      roleId: '',
    });
    this.isInviteModalOpen.set(true);
  }

  saveInvite(): void {
    if (this.inviteForm.invalid) return;
    const body = this.inviteForm.value;
    const cleanedBody = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      departmentId: body.departmentId === '' ? null : body.departmentId,
      roleId: body.roleId === '' ? null : body.roleId,
    };

    this.http.post<any>('/api/v1/org/users/invite', cleanedBody).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess(this.translocoService.translate('org.invite_sent_success'));
          this.isInviteModalOpen.set(false);
          const current = this.selectedNode();
          if (current && current.type === 'department' && current.data.id === cleanedBody.departmentId) {
            this.loadEmployees(current.data.id);
          }
        }
      },
      error: (err) => {
        const errorKey = err.error?.error?.messageKey || 'validation.error_occurred';
        this.toastService.showError(this.translocoService.translate(errorKey));
      }
    });
  }
}
