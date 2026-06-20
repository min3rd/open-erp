import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonActionSheet,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  addCircle,
  location,
  briefcase,
  chevronForward,
  chevronDown,
  create,
  trash,
  mail,
  call,
  person,
  arrowForward,
  close,
  people,
  paperPlane,
  refresh,
  closeCircle
} from 'ionicons/icons';
import {
  ModalComponent,
  ButtonComponent,
  InputComponent,
  SelectComponent,
  IconComponent,
  ToastService,
  TreeViewComponent,
  TreeNode,
  GuideTourComponent,
  TourStep
} from '@open-erp/shared';
import { InviteModalComponent } from './invite-modal/invite-modal.component';

@Component({
  selector: 'app-org-structure',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslocoPipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonActionSheet,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    ModalComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    TreeViewComponent,
    GuideTourComponent,
    IconComponent
  ],
  templateUrl: './org-structure.page.html',
  styleUrls: ['./org-structure.page.scss']
})
export class OrgStructurePage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly translocoService = inject(TranslocoService);
  private readonly toastService = inject(ToastService);
  private readonly modalController = inject(ModalController);

  // Data Signals
  branches = signal<any[]>([]);
  departmentsTree = signal<TreeNode[]>([]);
  departmentsFlat = signal<any[]>([]);
  users = signal<any[]>([]);
  invitedUsers = signal<any[]>([]);
  roles = signal<any[]>([]);
  selectedSegment = signal<'structure' | 'employees'>('structure');
  selectedUser = signal<any | null>(null);
  
  // Selection
  selectedNode = signal<{ type: 'branch' | 'department'; data: any } | null>(null);
  selectedNodeEmployees = signal<any[]>([]);
  
  // Modal States
  isBranchModalOpen = signal<boolean>(false);
  isDepartmentModalOpen = signal<boolean>(false);
  editingBranch = signal<any | null>(null);
  editingDepartment = signal<any | null>(null);

  showGuide = signal<boolean>(false);

  steps: TourStep[] = [
    {
      title: 'guide.org_mobile_branches_title',
      description: 'guide.org_mobile_branches_desc',
      selector: '#branches-section-mobile'
    },
    {
      title: 'guide.org_mobile_depts_title',
      description: 'guide.org_mobile_depts_desc',
      selector: '#depts-section-mobile'
    },
    {
      title: 'guide.org_mobile_seed_title',
      description: 'guide.org_mobile_seed_desc',
      selector: '#seed-section-mobile'
    },
    {
      title: 'guide.org_mobile_details_title',
      description: 'guide.org_mobile_details_desc',
      selector: '#details-section-mobile'
    }
  ];

  triggerGuide() {
    this.showGuide.set(true);
  }

  // Seeding Controls
  industryControl = new FormControl('');
  selectedIndustry = signal<string>('');
  industryOptions = computed(() => [
    { value: '', label: this.translocoService.translate('org.select_industry') },
    { value: 'technology', label: this.translocoService.translate('org.industry_technology') },
    { value: 'retail', label: this.translocoService.translate('org.industry_retail') },
    { value: 'manufacturing', label: this.translocoService.translate('org.industry_manufacturing') },
    { value: 'services', label: this.translocoService.translate('org.industry_services') }
  ]);

  // Active Node ID helper
  activeNodeId = computed(() => {
    const selected = this.selectedNode();
    return selected?.type === 'department' ? selected.data.id : null;
  });

  // Action Sheets
  isActionSheetOpen = signal<boolean>(false);
  actionSheetButtons: any[] = [];

  // Forms
  branchForm!: FormGroup;
  departmentForm!: FormGroup;

  // Select Options Helpers
  parentDeptOptions = computed(() => {
    const list = this.departmentsFlat()
      .filter(d => !this.editingDepartment() || d.id !== this.editingDepartment().id)
      .map(d => ({ value: d.id, label: d.name }));
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

  constructor() {
    addIcons({
      add,
      addCircle,
      location,
      briefcase,
      chevronForward,
      chevronDown,
      create,
      trash,
      mail,
      call,
      person,
      arrowForward,
      close,
      people,
      paperPlane,
      refresh,
      closeCircle
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.loadData();
    this.industryControl.valueChanges.subscribe((val) => {
      this.selectedIndustry.set(val || '');
    });

    const seen = localStorage.getItem('guide_seen_org-structure-mobile');
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

    // 4. Load Users
    this.http.get<any>('/api/v1/org/departments/users').subscribe({
      next: (res) => {
        if (res.success) {
          this.users.set(res.data || []);
        }
      }
    });

    // 5. Load Invited Users
    this.http.get<any>('/api/v1/org/users').subscribe({
      next: (res) => {
        if (res.success) {
          this.invitedUsers.set(res.data || []);
        }
      }
    });

    // 6. Load Roles
    this.http.get<any>('/api/v1/auth/roles').subscribe({
      next: (res) => {
        if (res.success) {
          this.roles.set(res.data || []);
        }
      }
    });
  }

  selectBranch(branch: any): void {
    this.selectedNode.set({ type: 'branch', data: branch });
    this.selectedNodeEmployees.set([]);
    this.openActionSheetForNode();
  }

  selectDept(dept: any): void {
    this.selectedNode.set({ type: 'department', data: dept });
    this.http.get<any>(`/api/v1/org/departments/${dept.id}/employees`).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedNodeEmployees.set(res.data || []);
        }
      }
    });
    this.openActionSheetForNode();
  }

  private openActionSheetForNode(): void {
    const node = this.selectedNode();
    if (!node) return;

    this.actionSheetButtons = [
      {
        text: this.translocoService.translate('org.actions'),
        icon: 'create',
        handler: () => {
          if (node.type === 'branch') {
            this.openEditBranch(node.data);
          } else {
            this.openEditDepartment(node.data);
          }
        }
      },
      {
        text: this.translocoService.translate(node.type === 'branch' ? 'org.delete_branch' : 'org.delete_department'),
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          if (node.type === 'branch') {
            this.deleteBranch(node.data.id);
          } else {
            this.deleteDepartment(node.data.id);
          }
        }
      },
      {
        text: this.translocoService.translate('org.cancel'),
        role: 'cancel',
        icon: 'close'
      }
    ];
    this.isActionSheetOpen.set(true);
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

  async openInviteModal() {
    const modal = await this.modalController.create({
      component: InviteModalComponent,
      componentProps: {
        selectedDepartmentId: this.selectedNode()?.type === 'department' ? this.selectedNode()?.data.id : null,
        departments: this.departmentsFlat(),
        roles: this.roles(),
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.success) {
      this.loadData();
    }
  }

  openActionSheetForUser(user: any): void {
    this.selectedUser.set(user);
    const isPending = user.status === 'Pending';

    if (isPending) {
      this.actionSheetButtons = [
        {
          text: this.translocoService.translate('org.resend_invite'),
          icon: 'refresh',
          handler: () => {
            this.resendInvite(user.id);
          }
        },
        {
          text: this.translocoService.translate('org.cancel_invite'),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.cancelInvite(user.id, user);
          }
        },
        {
          text: this.translocoService.translate('org.cancel'),
          role: 'cancel',
          icon: 'close'
        }
      ];
    } else {
      this.actionSheetButtons = [
        {
          text: this.translocoService.translate('org.remove_from_org'),
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.cancelInvite(user.id, user);
          }
        },
        {
          text: this.translocoService.translate('org.cancel'),
          role: 'cancel',
          icon: 'close'
        }
      ];
    }
    this.isActionSheetOpen.set(true);
  }

  resendInvite(id: string): void {
    this.http.post<any>(`/api/v1/org/users/${id}/resend`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.showSuccess(this.translocoService.translate('org.invite_sent_success'));
          this.loadData();
        }
      },
      error: (err) => {
        const errorKey = err.error?.error?.messageKey || 'validation.error_occurred';
        this.toastService.showError(this.translocoService.translate(errorKey));
      }
    });
  }

  cancelInvite(id: string, user: any): void {
    const confirmMsg = user.status === 'Pending'
      ? this.translocoService.translate('org.cancel_invite') + '?'
      : this.translocoService.translate('org.remove_from_org') + '?';

    if (!confirm(confirmMsg)) return;

    this.http.delete<any>(`/api/v1/org/users/${id}`).subscribe({
      next: (res) => {
        if (res.success) {
          const successMsg = user.status === 'Pending'
            ? this.translocoService.translate('org.invite_cancelled')
            : this.translocoService.translate('org.employee_removed');
          this.toastService.showSuccess(successMsg);
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
