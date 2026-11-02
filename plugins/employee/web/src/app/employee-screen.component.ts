import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
  IconComponent,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpToggleComponent,
  TranslatePipe,
} from '@shared';
import {
  ApprovalConfig,
  Assignment,
  AssignmentWriteRequest,
  BranchOption,
  Campaign,
  ChangeRequest,
  Contract,
  ContractWriteRequest,
  DepartmentOption,
  DirectoryEntry,
  EmployeeDetail,
  EmployeeDocument,
  EmployeeSummary,
  EmployeeWriteRequest,
  FieldConfig,
  ImportResult,
  OnboardingInvite,
  OrgChartNode,
  PrivacyRequest,
  SignedUrlResponse,
} from './employee.model';
import { EmployeeService } from './employee.service';

type Tab = 'list' | 'requests' | 'directory' | 'me' | 'config' | 'tools';
type DrawerMode = 'edit' | 'request' | 'self';
type ToolSection = 'fields' | 'onboarding' | 'campaigns' | 'privacy';
type DrawerSection = 'profile' | 'assignments' | 'contracts' | 'documents';

const EDITABLE_SELF_FIELDS = [
  'phone', 'personal_email', 'current_address', 'permanent_address',
  'emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone',
];

@Component({
  selector: 'app-employee-screen',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    BadgeComponent,
    SharpButtonComponent,
    DrawerComponent,
    IconComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpToggleComponent,
  ],
  templateUrl: './employee-screen.component.html',
})
export class EmployeeScreenComponent implements OnInit, OnDestroy {
  private service = inject(EmployeeService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly tab = signal<Tab>('list');
  readonly employees = signal<EmployeeSummary[]>([]);
  readonly me = signal<EmployeeDetail | null>(null);
  readonly requests = signal<ChangeRequest[]>([]);
  readonly myRequests = signal<ChangeRequest[]>([]);
  readonly directory = signal<DirectoryEntry[]>([]);
  readonly myDocuments = signal<EmployeeDocument[]>([]);
  readonly search = signal('');
  readonly drawerOpen = signal(false);
  readonly drawerMode = signal<DrawerMode>('edit');
  readonly selected = signal<EmployeeDetail | null>(null);
  readonly selectedRequest = signal<ChangeRequest | null>(null);
  readonly requestEmployee = signal<EmployeeDetail | null>(null);
  readonly selectedAssignments = signal<Assignment[]>([]);
  readonly selectedContracts = signal<Contract[]>([]);
  readonly selectedDocuments = signal<EmployeeDocument[]>([]);
  readonly drawerSection = signal<DrawerSection>('profile');
  readonly branches = signal<BranchOption[]>([]);
  readonly departments = signal<DepartmentOption[]>([]);
  readonly assignmentFormOpen = signal(false);
  readonly contractFormOpen = signal(false);
  readonly contractEditingId = signal<string | null>(null);
  readonly selfFields = EDITABLE_SELF_FIELDS;
  readonly documentTypeOptions: SelectOption[] = [
    { value: 'CONTRACT', labelKey: 'PLUGIN_EMPLOYEE_DOC_CONTRACT' },
    { value: 'ID_CARD', labelKey: 'PLUGIN_EMPLOYEE_DOC_ID_CARD' },
    { value: 'DEGREE', labelKey: 'PLUGIN_EMPLOYEE_DOC_DEGREE' },
    { value: 'CERTIFICATE', labelKey: 'PLUGIN_EMPLOYEE_DOC_CERTIFICATE' },
    { value: 'INSURANCE', labelKey: 'PLUGIN_EMPLOYEE_DOC_INSURANCE' },
    { value: 'TAX', labelKey: 'PLUGIN_EMPLOYEE_DOC_TAX' },
    { value: 'RESUME', labelKey: 'PLUGIN_EMPLOYEE_DOC_RESUME' },
    { value: 'MEDICAL', labelKey: 'PLUGIN_EMPLOYEE_DOC_MEDICAL' },
    { value: 'OTHER', labelKey: 'PLUGIN_EMPLOYEE_DOC_OTHER' },
  ];
  readonly approvalConfigs = signal<ApprovalConfig[]>([]);
  readonly selectedApproval = signal<ApprovalConfig | null>(null);
  readonly fieldConfigs = signal<FieldConfig[]>([]);
  readonly onboardingInvites = signal<OnboardingInvite[]>([]);
  readonly campaigns = signal<Campaign[]>([]);
  readonly privacyRequests = signal<PrivacyRequest[]>([]);
  readonly pendingEraseId = signal<string | null>(null);
  readonly orgNodes = signal<OrgChartNode[]>([]);
  readonly importResult = signal<ImportResult | null>(null);
  readonly toolSection = signal<ToolSection>('fields');
  readonly lastInviteLink = signal<string | null>(null);
  readonly lastInviteNotified = signal(false);
  readonly lastInviteReason = signal<string | null>(null);
  readonly statusFilter = signal('');
  readonly typeFilter = signal('');
  readonly employeePage = signal(0);
  readonly employeeTotal = signal(0);
  readonly stats = signal<EmployeeSummary[]>([]);
  readonly requestPage = signal(0);
  readonly requestTotal = signal(0);
  readonly invitePage = signal(0);
  readonly inviteTotal = signal(0);
  readonly campaignPage = signal(0);
  readonly campaignTotal = signal(0);
  readonly privacyPage = signal(0);
  readonly privacyTotal = signal(0);
  readonly contractPage = signal(0);
  readonly assignmentPage = signal(0);
  readonly pageSize = 10;
  inviteEmail = '';
  campaignName = '';
  importRows: EmployeeWriteRequest[] = [];
  private autoBootstrapFieldConfigs = false;

  get tabs(): Array<{ key: Tab; labelKey: string; icon: string; count?: number }> {
    const items: Array<{ key: Tab; labelKey: string; icon: string; count?: number }> = [];
    if (this.can('employee:profile:read')) {
      items.push({ key: 'list', labelKey: 'PLUGIN_EMPLOYEE_LIST', icon: 'user', count: this.employees().length });
    }
    if (this.can('employee:change-request:read')) {
      items.push({ key: 'requests', labelKey: 'PLUGIN_EMPLOYEE_REQUESTS', icon: 'file-text',
        count: this.requests().filter((item) => item.status === 'PENDING').length });
    }
    if (this.can('employee:directory:read')) {
      items.push({ key: 'directory', labelKey: 'PLUGIN_EMPLOYEE_DIRECTORY', icon: 'grid', count: this.directory().length });
    }
    if (this.can('employee:self:read')) {
      items.push({ key: 'me', labelKey: 'PLUGIN_EMPLOYEE_MY', icon: 'user' });
    }
    if (this.can('employee:approval-config:manage')) {
      items.push({ key: 'config', labelKey: 'PLUGIN_EMPLOYEE_CONFIG', icon: 'settings' });
    }
    if (this.can('employee:field-config:manage') || this.can('employee:onboarding:manage')
        || this.can('employee:campaign:manage') || this.can('employee:privacy:manage')) {
      items.push({ key: 'tools', labelKey: 'PLUGIN_EMPLOYEE_TOOLS', icon: 'settings' });
    }
    return items;
  }

  get toolSections(): Array<{ key: ToolSection; labelKey: string; descKey: string; icon: string }> {
    const items: Array<{ key: ToolSection; labelKey: string; descKey: string; icon: string }> = [];
    if (this.can('employee:field-config:manage')) {
      items.push({ key: 'fields', labelKey: 'PLUGIN_EMPLOYEE_FIELD_CONFIG', descKey: 'PLUGIN_EMPLOYEE_FIELD_CONFIG_DESC', icon: 'settings' });
    }
    if (this.can('employee:onboarding:manage')) {
      items.push({ key: 'onboarding', labelKey: 'PLUGIN_EMPLOYEE_ONBOARDING', descKey: 'PLUGIN_EMPLOYEE_ONBOARDING_DESC', icon: 'user' });
    }
    if (this.can('employee:campaign:manage')) {
      items.push({ key: 'campaigns', labelKey: 'PLUGIN_EMPLOYEE_CAMPAIGNS', descKey: 'PLUGIN_EMPLOYEE_CAMPAIGNS_DESC', icon: 'file-text' });
    }
    if (this.can('employee:privacy:manage')) {
      items.push({ key: 'privacy', labelKey: 'PLUGIN_EMPLOYEE_PRIVACY', descKey: 'PLUGIN_EMPLOYEE_PRIVACY_DESC', icon: 'shield' });
    }
    return items;
  }

  countStatus(status: string): number {
    return this.stats().filter((item) => item.status === status).length;
  }

  get activeCount(): number {
    return this.countStatus('ACTIVE');
  }

  get probationCount(): number {
    return this.countStatus('PROBATION');
  }

  get leftCount(): number {
    return this.countStatus('LEFT') + this.countStatus('RETIRED');
  }

  fieldLabelKey(fieldKey: string): string {
    const known: Record<string, string> = {
      phone: 'PLUGIN_EMPLOYEE_FIELD_PHONE',
      personal_email: 'PLUGIN_EMPLOYEE_FIELD_PERSONAL_EMAIL',
      date_of_birth: 'PLUGIN_EMPLOYEE_DOB',
      gender: 'PLUGIN_EMPLOYEE_FIELD_GENDER',
      nationality: 'PLUGIN_EMPLOYEE_FIELD_NATIONALITY',
      marital_status: 'PLUGIN_EMPLOYEE_FIELD_MARITAL_STATUS',
      current_address: 'PLUGIN_EMPLOYEE_FIELD_CURRENT_ADDRESS',
      permanent_address: 'PLUGIN_EMPLOYEE_FIELD_PERMANENT_ADDRESS',
      emergency_contact_name: 'PLUGIN_EMPLOYEE_FIELD_EMERGENCY_CONTACT_NAME',
      emergency_contact_relationship: 'PLUGIN_EMPLOYEE_FIELD_EMERGENCY_CONTACT_RELATIONSHIP',
      emergency_contact_phone: 'PLUGIN_EMPLOYEE_FIELD_EMERGENCY_CONTACT_PHONE',
      education_level: 'PLUGIN_EMPLOYEE_FIELD_EDUCATION_LEVEL',
      school: 'PLUGIN_EMPLOYEE_FIELD_SCHOOL',
      major: 'PLUGIN_EMPLOYEE_FIELD_MAJOR',
      graduation_year: 'PLUGIN_EMPLOYEE_FIELD_GRADUATION_YEAR',
      work_email: 'AUTH_EMAIL_LABEL',
      full_name: 'PLUGIN_EMPLOYEE_NAME',
    };
    return known[fieldKey] ?? fieldKey;
  }

  employeeName(employeeId?: string): string {
    if (!employeeId) {
      return '—';
    }
    return this.employees().find((item) => item.id === employeeId)?.full_name ?? employeeId;
  }

  initials(name?: string): string {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return '?';
    }
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  formatDate(value?: string): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
  }

  selectTool(section: ToolSection): void {
    this.toolSection.set(section);
  }

  bootstrapFieldConfigs(): void {
    this.saving.set(true);
    this.service.bootstrapFieldConfigs().subscribe({
      next: () => {
        this.saving.set(false);
        this.service.fieldConfigs().subscribe({
          next: (res) => this.fieldConfigs.set(res.data?.items ?? []),
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  copyInviteLink(): void {
    const link = this.lastInviteLink();
    if (link) {
      void navigator.clipboard.writeText(link);
    }
  }

  get drawerTitleKey(): string {
    switch (this.drawerMode()) {
      case 'request': return 'PLUGIN_EMPLOYEE_TAB_REQUEST';
      case 'self': return 'PLUGIN_EMPLOYEE_SUBMIT_REQUEST';
      default: return this.selected() ? 'PLUGIN_EMPLOYEE_EDIT' : 'PLUGIN_EMPLOYEE_CREATE';
    }
  }

  get headerSubtitleKey(): string {
    switch (this.tab()) {
      case 'requests': return 'PLUGIN_EMPLOYEE_REQUESTS';
      case 'directory': return 'PLUGIN_EMPLOYEE_DIRECTORY';
      case 'me': return 'PLUGIN_EMPLOYEE_MY';
      case 'config': return 'PLUGIN_EMPLOYEE_CONFIG';
      case 'tools': return 'PLUGIN_EMPLOYEE_TOOLS';
      default: return 'PLUGIN_EMPLOYEE_LIST';
    }
  }

  /** Injected by the plugin host; absent claim means "do not hide". */
  @Input() permissions: string[] = [];

  form: EmployeeWriteRequest = {};
  assignmentForm: AssignmentWriteRequest = this.emptyAssignment();
  contractForm: ContractWriteRequest = this.emptyContract();
  selfChanges: Record<string, string> = {};
  rejectReason = '';
  documentType = 'CONTRACT';
  selectedFile: File | null = null;
  selfDocumentType = 'OTHER';
  selfFile: File | null = null;

  @Input()
  set apiBaseUrl(value: string) {
    this.service.setRuntimeOrigin(value);
  }

  ngOnInit(): void {
    this.tab.set(this.defaultTab());
    const firstTool = this.toolSections[0]?.key;
    if (firstTool) {
      this.toolSection.set(firstTool);
    }
    window.addEventListener('op:before-tenant-switch', this.guardTenantSwitch);
    this.load();
  }

  ngOnDestroy(): void {
    window.removeEventListener('op:before-tenant-switch', this.guardTenantSwitch);
  }

  private readonly guardTenantSwitch = (event: Event): void => {
    if (!this.drawerOpen()) {
      return;
    }
    event.preventDefault();
    this.actionError.set('PLUGIN_EMPLOYEE_UNSAVED_TENANT');
  };

  private defaultTab(): Tab {
    if (this.can('employee:profile:read')) return 'list';
    if (this.can('employee:self:read')) return 'me';
    if (this.can('employee:directory:read')) return 'directory';
    if (this.can('employee:change-request:read')) return 'requests';
    if (this.can('employee:field-config:manage')) return 'tools';
    return 'me';
  }

  can(permission: string): boolean {
    return !this.permissions?.length || this.permissions.includes(permission);
  }

  selectTab(tab: Tab): void {
    this.tab.set(tab);
  }

  get canEditSelected(): boolean {
    return this.selected() ? this.can('employee:profile:update') : this.can('employee:profile:create');
  }

  get drawerSections(): Array<{ key: DrawerSection; labelKey: string; icon: string }> {
    const items: Array<{ key: DrawerSection; labelKey: string; icon: string }> = [
      { key: 'profile', labelKey: 'PLUGIN_EMPLOYEE_SECTION_PROFILE', icon: 'user' },
      { key: 'assignments', labelKey: 'PLUGIN_EMPLOYEE_ASSIGNMENTS', icon: 'grid' },
      { key: 'contracts', labelKey: 'PLUGIN_EMPLOYEE_CONTRACTS', icon: 'file-text' },
    ];
    if (this.can('employee:document:read')) {
      items.push({ key: 'documents', labelKey: 'PLUGIN_EMPLOYEE_DOCUMENTS', icon: 'file-text' });
    }
    return items;
  }

  selectDrawerSection(section: DrawerSection): void {
    this.drawerSection.set(section);
    this.actionError.set(null);
  }

  get branchOptions(): SelectOption[] {
    return this.branches().map((item) => ({ value: item.id, label: item.name }));
  }

  get assignmentStatusOptions(): SelectOption[] {
    return this.enumOptions(['ACTIVE', 'INACTIVE']);
  }

  get contractTypeOptions(): SelectOption[] {
    return this.enumOptions(['LABOR', 'FIXED_TERM', 'INDEFINITE', 'INTERNSHIP', 'CONSULTANT']);
  }

  get contractStatusOptions(): SelectOption[] {
    return this.enumOptions(['ACTIVE', 'EXPIRED', 'TERMINATED', 'DRAFT']);
  }

  get employeeStatusOptions(): SelectOption[] {
    return this.enumOptions(['DRAFT', 'ACTIVE', 'PROBATION', 'LEAVE', 'LEFT', 'RETIRED']);
  }

  get employeeTypeOptions(): SelectOption[] {
    return this.enumOptions(['EMPLOYEE', 'CONTRACTOR', 'INTERN']);
  }

  get approvalScopeOptions(): SelectOption[] {
    return this.enumOptions(['TENANT', 'BRANCH', 'DEPARTMENT']);
  }

  get fieldGroupOptions(): SelectOption[] {
    return this.enumOptions(['PROFILE', 'CONTACT', 'PERSONAL', 'LEGAL', 'EDUCATION', 'GENERAL', 'ALL']);
  }

  get approverTypeOptions(): SelectOption[] {
    return this.enumOptions(['ROLE', 'USER', 'MANAGER']);
  }

  enumOptions(values: string[]): SelectOption[] {
    return values.map((value) => ({ value, labelKey: `PLUGIN_EMPLOYEE_ENUM_${value}` }));
  }

  enumLabel(value?: string): string {
    return value ? `PLUGIN_EMPLOYEE_ENUM_${value}` : '—';
  }

  branchName(id?: string): string {
    if (!id) {
      return '—';
    }
    return this.branches().find((item) => item.id === id)?.name ?? id;
  }

  departmentName(id?: string): string {
    if (!id) {
      return '—';
    }
    return this.departments().find((item) => item.id === id)?.name ?? id;
  }

  departmentOptions(branchId?: string): SelectOption[] {
    return this.departments()
      .filter((item) => !branchId || item.branch_id === branchId)
      .map((item) => ({ value: item.id, label: item.name }));
  }

  employeeOptions(excludeId?: string): SelectOption[] {
    return [
      { value: '', label: '—' },
      ...this.employees()
        .filter((item) => item.id !== excludeId)
        .map((item) => ({ value: item.id, label: `${item.full_name} · ${item.employee_code}` })),
    ];
  }

  openAssignmentForm(): void {
    this.assignmentForm = this.emptyAssignment();
    this.assignmentFormOpen.set(true);
  }

  cancelAssignmentForm(): void {
    this.assignmentFormOpen.set(false);
  }

  onAssignmentBranchChange(branchId: string): void {
    this.assignmentForm.branch_id = branchId;
    const department = this.departmentOptions(branchId)[0];
    this.assignmentForm.department_id = department?.value ?? '';
  }

  saveAssignment(): void {
    const employee = this.selected();
    if (!employee || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    this.service.createAssignment(employee.id, this.assignmentForm).subscribe({
      next: () => {
        this.saving.set(false);
        this.assignmentFormOpen.set(false);
        this.loadEmployeeDetails(employee.id);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  openContractForm(contract?: Contract): void {
    this.contractEditingId.set(contract?.id ?? null);
    this.contractForm = contract ? {
      contract_type: contract.contract_type ?? 'LABOR',
      contract_no: contract.contract_no ?? '',
      start_date: contract.start_date ?? '',
      end_date: contract.end_date ?? '',
      status: contract.status ?? 'ACTIVE',
      document_id: contract.document_id,
    } : this.emptyContract();
    this.contractFormOpen.set(true);
  }

  cancelContractForm(): void {
    this.contractFormOpen.set(false);
    this.contractEditingId.set(null);
  }

  saveContract(): void {
    const employee = this.selected();
    if (!employee || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    const editingId = this.contractEditingId();
    const request = editingId
      ? this.service.updateContract(editingId, this.contractForm)
      : this.service.createContract(employee.id, this.contractForm);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.contractFormOpen.set(false);
        this.contractEditingId.set(null);
        this.loadEmployeeDetails(employee.id);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  private emptyAssignment(): AssignmentWriteRequest {
    const branch = this.branches()[0];
    const department = this.departments().find((item) => item.branch_id === branch?.id) ?? this.departments()[0];
    return {
      branch_id: branch?.id ?? '',
      department_id: department?.id ?? '',
      job_title: '',
      is_primary: true,
      valid_from: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
    };
  }

  private emptyContract(): ContractWriteRequest {
    return {
      contract_type: 'LABOR',
      contract_no: '',
      start_date: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
    };
  }

  private loadOrgOptions(): void {
    this.service.branches().subscribe({
      next: (res) => this.branches.set(res.data?.items ?? []),
      error: () => this.branches.set([]),
    });
    this.service.departments().subscribe({
      next: (res) => this.departments.set(res.data?.items ?? []),
      error: () => this.departments.set([]),
    });
  }

  filteredEmployees(): EmployeeSummary[] {
    return this.employees();
  }

  pageCount(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  prevPage(kind: 'employee' | 'request' | 'invite' | 'campaign' | 'privacy'): void {
    const page = this.pageSignal(kind);
    if (page() > 0) {
      page.set(page() - 1);
      this.load();
    }
  }

  nextPage(kind: 'employee' | 'request' | 'invite' | 'campaign' | 'privacy'): void {
    const page = this.pageSignal(kind);
    const total = this.totalSignal(kind);
    if (page() + 1 < this.pageCount(total())) {
      page.set(page() + 1);
      this.load();
    }
  }

  private pageSignal(kind: 'employee' | 'request' | 'invite' | 'campaign' | 'privacy') {
    switch (kind) {
      case 'request': return this.requestPage;
      case 'invite': return this.invitePage;
      case 'campaign': return this.campaignPage;
      case 'privacy': return this.privacyPage;
      default: return this.employeePage;
    }
  }

  private totalSignal(kind: 'employee' | 'request' | 'invite' | 'campaign' | 'privacy') {
    switch (kind) {
      case 'request': return this.requestTotal;
      case 'invite': return this.inviteTotal;
      case 'campaign': return this.campaignTotal;
      case 'privacy': return this.privacyTotal;
      default: return this.employeeTotal;
    }
  }

  pagedContracts(): Contract[] {
    const start = this.contractPage() * this.pageSize;
    return this.selectedContracts().slice(start, start + this.pageSize);
  }

  pagedAssignments(): Assignment[] {
    const start = this.assignmentPage() * this.pageSize;
    return this.selectedAssignments().slice(start, start + this.pageSize);
  }

  changeContractPage(delta: number): void {
    const next = this.contractPage() + delta;
    if (next >= 0 && next < this.pageCount(this.selectedContracts().length)) {
      this.contractPage.set(next);
    }
  }

  changeAssignmentPage(delta: number): void {
    const next = this.assignmentPage() + delta;
    if (next >= 0 && next < this.pageCount(this.selectedAssignments().length)) {
      this.assignmentPage.set(next);
    }
  }

  clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
    this.typeFilter.set('');
    this.employeePage.set(0);
    this.load();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.employeePage.set(0);
    this.load();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter.set(value);
    this.employeePage.set(0);
    this.load();
  }

  onTypeFilterChange(value: string): void {
    this.typeFilter.set(value);
    this.employeePage.set(0);
    this.load();
  }

  get hasFilters(): boolean {
    return !!this.search().trim() || !!this.statusFilter() || !!this.typeFilter();
  }

  filteredDirectory(): DirectoryEntry[] {
    const query = this.search().trim().toLowerCase();
    if (!query) {
      return this.directory();
    }
    return this.directory().filter((item) =>
      [item.employee_code, item.full_name, item.job_title, item.work_email]
        .some((value) => (value ?? '').toLowerCase().includes(query)));
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    if (this.can('employee:profile:read')) {
      this.service.list(this.search(), this.statusFilter(), this.typeFilter(), this.employeePage(), this.pageSize).subscribe({
        next: (res) => {
          this.employees.set(res.data?.items ?? []);
          this.employeeTotal.set(res.data?.total_items ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('COMMON_LOAD_ERROR');
          this.loading.set(false);
        },
      });
      this.service.list('', '', '', 0, 500).subscribe({
        next: (res) => this.stats.set(res.data?.items ?? []),
        error: () => this.stats.set([]),
      });
    } else {
      this.loading.set(false);
    }
    if (this.can('employee:self:read')) {
      this.service.me().subscribe({
        next: (res) => {
          this.me.set(res.data ?? null);
          if (res.data) {
            this.loadSelfData();
          }
        },
        error: () => this.me.set(null),
      });
    }
    if (this.can('employee:change-request:read')) {
      this.service.changeRequests('', this.requestPage(), this.pageSize).subscribe({
        next: (res) => {
          this.requests.set(res.data?.items ?? []);
          this.requestTotal.set(res.data?.total_items ?? 0);
        },
        error: () => this.requests.set([]),
      });
    }
    if (this.can('employee:directory:read')) {
      this.service.directory().subscribe({
        next: (res) => this.directory.set(res.data?.items ?? []),
        error: () => this.directory.set([]),
      });
      this.service.orgChart().subscribe({
        next: (res) => this.orgNodes.set(res.data?.items ?? []),
        error: () => this.orgNodes.set([]),
      });
    }
    if (this.can('employee:field-config:manage')) {
      this.service.fieldConfigs().subscribe({
        next: (res) => {
          const items = res.data?.items ?? [];
          this.fieldConfigs.set(items);
          if (!items.length && !this.autoBootstrapFieldConfigs) {
            this.autoBootstrapFieldConfigs = true;
            this.bootstrapFieldConfigs();
          }
        },
        error: () => this.fieldConfigs.set([]),
      });
    }
    if (this.can('employee:onboarding:manage')) {
      this.service.onboardingInvites(this.invitePage(), this.pageSize).subscribe({
        next: (res) => {
          this.onboardingInvites.set(res.data?.items ?? []);
          this.inviteTotal.set(res.data?.total_items ?? 0);
        },
        error: () => this.onboardingInvites.set([]),
      });
    }
    if (this.can('employee:campaign:manage')) {
      this.service.campaigns(this.campaignPage(), this.pageSize).subscribe({
        next: (res) => {
          this.campaigns.set(res.data?.items ?? []);
          this.campaignTotal.set(res.data?.total_items ?? 0);
        },
        error: () => this.campaigns.set([]),
      });
    }
    if (this.can('employee:privacy:manage')) {
      this.service.privacyRequests(this.privacyPage(), this.pageSize).subscribe({
        next: (res) => {
          this.privacyRequests.set(res.data?.items ?? []);
          this.privacyTotal.set(res.data?.total_items ?? 0);
        },
        error: () => this.privacyRequests.set([]),
      });
    }
    if (this.can('employee:approval-config:manage')) {
      this.service.approvalConfigs().subscribe({
        next: (res) => {
          const current = this.selectedApproval();
          const currentId = current?.id;
          const items = res.data?.items ?? [];
          this.approvalConfigs.set(items);
          const selected = (currentId ? items.find((item) => item.id === currentId) : null)
            ?? this.approvalFlow()[0]
            ?? null;
          this.selectedApproval.set(selected);
        },
        error: () => this.approvalConfigs.set([]),
      });
    }
  }

  private loadSelfData(): void {
    this.service.myChangeRequests().subscribe({
      next: (res) => this.myRequests.set(res.data?.items ?? []),
      error: () => this.myRequests.set([]),
    });
    this.service.myDocuments().subscribe({
      next: (res) => this.myDocuments.set(res.data?.items ?? []),
      error: () => this.myDocuments.set([]),
    });
  }

  addApprovalStep(): void {
    const nextStep = Math.max(0, ...this.approvalConfigs().map((item) => item.step_no || 0)) + 1;
    const item: ApprovalConfig = {
      scope_type: 'TENANT',
      field_group: 'PROFILE',
      step_no: nextStep,
      approver_type: 'ROLE',
    };
    this.approvalConfigs.update((items) => [...items, item]);
    this.selectedApproval.set(item);
  }

  approvalFlow(): ApprovalConfig[] {
    return [...this.approvalConfigs()].sort((a, b) =>
      (a.step_no || 0) - (b.step_no || 0)
      || a.scope_type.localeCompare(b.scope_type)
      || a.field_group.localeCompare(b.field_group)
      || (a.scope_id ?? '').localeCompare(b.scope_id ?? ''));
  }

  isApprovalSelected(item: ApprovalConfig): boolean {
    return this.selectedApproval() === item;
  }

  selectApproval(item: ApprovalConfig): void {
    this.selectedApproval.set(item);
  }

  private approvalKey(item: ApprovalConfig): string {
    return [item.scope_type, item.scope_id ?? '', item.field_group, item.step_no].join('|');
  }

  scopeIdOptions(item: ApprovalConfig): SelectOption[] {
    let options: SelectOption[] = [];
    if (item.scope_type === 'BRANCH') {
      options = this.branches().map((branch) => ({ value: branch.id, label: branch.name }));
    } else if (item.scope_type === 'DEPARTMENT') {
      options = this.departments().map((department) => ({ value: department.id, label: department.name }));
    }
    if (item.scope_id && !options.some((option) => option.value === item.scope_id)) {
      options = [{ value: item.scope_id, label: item.scope_id }, ...options];
    }
    return options;
  }

  removeApprovalStep(item: ApprovalConfig): void {
    const apply = () => {
      this.approvalConfigs.update((items) => items.filter((row) => row !== item));
      if (this.selectedApproval() === item) {
        this.selectedApproval.set(this.approvalFlow()[0] ?? null);
      }
    };
    if (item.id) {
      this.service.deleteApprovalConfig(item.id).subscribe({
        next: apply,
        error: (err) => this.actionError.set(this.code(err)),
      });
      return;
    }
    apply();
  }

  saveApprovals(): void {
    if (this.saving()) {
      return;
    }
    const current = this.selectedApproval();
    const currentId = current?.id;
    const currentKey = current ? this.approvalKey(current) : null;
    this.saving.set(true);
    this.actionError.set(null);
    this.service.updateApprovalConfigs(this.approvalConfigs()).subscribe({
      next: (res) => {
        this.saving.set(false);
        const items = res.data?.items ?? [];
        this.approvalConfigs.set(items);
        const flow = this.approvalFlow();
        const selected = (currentId ? flow.find((item) => item.id === currentId) : null)
          ?? (currentKey ? flow.find((item) => this.approvalKey(item) === currentKey) : null)
          ?? flow[0]
          ?? null;
        this.selectedApproval.set(selected);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  toggleFieldConfig(item: FieldConfig, key: 'editable_by_employee' | 'requires_approval'): void {
    item[key] = !item[key];
  }

  saveFieldConfigs(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    this.service.updateFieldConfigs(this.fieldConfigs()).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.fieldConfigs.set(res.data?.items ?? []);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  addInvite(): void {
    const email = this.inviteEmail.trim();
    if (!email || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.service.createOnboardingInvite(email).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.inviteEmail = '';
        this.lastInviteLink.set(res.data?.link ?? null);
        this.lastInviteNotified.set(res.data?.in_app_notified ?? false);
        this.lastInviteReason.set(res.data?.notify_reason ?? null);
        this.invitePage.set(0);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  revokeInvite(item: OnboardingInvite): void {
    this.service.revokeOnboardingInvite(item.id).subscribe({
      next: () => this.load(),
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  addCampaign(): void {
    const name = this.campaignName.trim();
    if (!name || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.service.createCampaign(name).subscribe({
      next: () => {
        this.saving.set(false);
        this.campaignName = '';
        this.campaignPage.set(0);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  closeCampaign(item: Campaign): void {
    this.service.closeCampaign(item.id).subscribe({
      next: () => this.load(),
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  completePrivacy(item: PrivacyRequest): void {
    this.service.completePrivacyRequest(item.id).subscribe({
      next: () => this.load(),
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  exportPrivacy(item: PrivacyRequest): void {
    this.service.exportPrivacyRequest(item.id).subscribe({
      next: (res) => {
        const blob = new Blob([JSON.stringify(res.data ?? {}, null, 2)], { type: 'application/json' });
        this.saveBlob(blob, `privacy-${item.request_type.toLowerCase()}-${item.id}.json`);
      },
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  erasePrivacy(item: PrivacyRequest): void {
    if (this.pendingEraseId() !== item.id) {
      this.pendingEraseId.set(item.id);
      return;
    }
    this.service.erasePrivacyRequest(item.id).subscribe({
      next: () => {
        this.pendingEraseId.set(null);
        this.load();
      },
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  exportEmployees(): void {
    this.service.exportEmployees().subscribe({
      next: (blob) => this.saveBlob(blob, 'employees.csv'),
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        const rows = Array.isArray(parsed) ? parsed : parsed.rows;
        if (!Array.isArray(rows)) {
          throw new Error('rows missing');
        }
        this.importRows = rows;
        this.importEmployees(true);
      } catch {
        this.actionError.set('EMPLOYEE_IMPORT_INVALID_JSON');
      }
    });
  }

  importEmployees(dryRun: boolean): void {
    if (!this.importRows.length || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    this.service.importEmployees(dryRun, this.importRows).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.importResult.set(res.data ?? null);
        if (!dryRun && (res.data?.imported ?? 0) > 0) {
          this.load();
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  openCreate(): void {
    this.actionError.set(null);
    this.selected.set(null);
    this.form = { status: 'DRAFT', employee_type: 'EMPLOYEE' };
    this.drawerSection.set('profile');
    this.drawerMode.set('edit');
    this.drawerOpen.set(true);
  }

  openEdit(item: EmployeeSummary): void {
    this.actionError.set(null);
    this.selectedAssignments.set([]);
    this.selectedContracts.set([]);
    this.selectedDocuments.set([]);
    this.contractPage.set(0);
    this.assignmentPage.set(0);
    this.assignmentFormOpen.set(false);
    this.contractFormOpen.set(false);
    this.contractEditingId.set(null);
    this.drawerSection.set('profile');
    this.loadOrgOptions();
    this.service.get(item.id).subscribe({
      next: (res) => {
        const detail = res.data ?? null;
        this.selected.set(detail);
        this.form = detail ? { ...detail } : { ...item };
        this.drawerMode.set('edit');
        this.drawerOpen.set(true);
        this.loadEmployeeDetails(item.id);
      },
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  private loadEmployeeDetails(employeeId: string): void {
    this.service.assignments(employeeId).subscribe({
      next: (res) => this.selectedAssignments.set(res.data?.items ?? []),
      error: () => this.selectedAssignments.set([]),
    });
    this.service.contracts(employeeId).subscribe({
      next: (res) => this.selectedContracts.set(res.data?.items ?? []),
      error: () => this.selectedContracts.set([]),
    });
    if (this.can('employee:document:read')) {
      this.service.documents(employeeId).subscribe({
        next: (res) => this.selectedDocuments.set(res.data?.items ?? []),
        error: () => this.selectedDocuments.set([]),
      });
    }
  }

  openRequest(item: ChangeRequest): void {
    this.actionError.set(null);
    this.rejectReason = '';
    this.requestEmployee.set(null);
    this.service.changeRequest(item.id).subscribe({
      next: (res) => {
        const request = res.data ?? item;
        this.selectedRequest.set(request);
        this.drawerMode.set('request');
        this.drawerOpen.set(true);
        this.service.get(request.employee_id).subscribe({
          next: (employee) => this.requestEmployee.set(employee.data ?? null),
          error: () => this.requestEmployee.set(null),
        });
      },
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  openSelfRequest(): void {
    this.actionError.set(null);
    this.selfChanges = {};
    this.drawerMode.set('self');
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  save(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    const existing = this.selected();
    const request = existing
      ? this.service.update(existing.id, this.form)
      : this.service.create(this.form);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawerOpen.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  offboard(): void {
    const item = this.selected();
    if (!item || this.saving()) {
      return;
    }
    const reason = this.form.exit_reason ?? '';
    this.saving.set(true);
    this.service.offboard(item.id, {
      exit_date: this.form.exit_date,
      exit_reason: reason,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.drawerOpen.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  approve(): void {
    const request = this.selectedRequest();
    if (!request || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    this.service.approve(request.id).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedRequest.set(res.data ?? null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  reject(): void {
    const request = this.selectedRequest();
    if (!request || this.saving() || !this.rejectReason.trim()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    this.service.reject(request.id, this.rejectReason.trim()).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedRequest.set(res.data ?? null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  submitSelfRequest(): void {
    const changes = Object.fromEntries(
      Object.entries(this.selfChanges).filter(([, value]) => value != null && String(value).trim() !== ''));
    if (Object.keys(changes).length === 0 || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    this.service.submitMyChange(changes).subscribe({
      next: () => {
        this.saving.set(false);
        this.drawerOpen.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  withdraw(request: ChangeRequest): void {
    this.service.withdrawMyChange(request.id).subscribe({
      next: () => this.load(),
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  onDocumentFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  uploadDocument(): void {
    const employee = this.selected();
    if (!employee || !this.selectedFile || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    this.service.uploadDocument(employee.id, this.selectedFile, this.documentType).subscribe({
      next: () => {
        this.saving.set(false);
        this.selectedFile = null;
        this.loadEmployeeDetails(employee.id);
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  downloadDocument(item: EmployeeDocument): void {
    this.service.documentSignedUrl(item.id).subscribe({
      next: (res) => this.openSignedDownload(res.data, item),
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  onSelfFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selfFile = input.files?.[0] ?? null;
  }

  uploadSelfDocument(): void {
    if (!this.selfFile || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.actionError.set(null);
    this.service.uploadMyDocument(this.selfFile, this.selfDocumentType).subscribe({
      next: () => {
        this.saving.set(false);
        this.selfFile = null;
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.actionError.set(this.code(err));
      },
    });
  }

  downloadMyDocument(item: EmployeeDocument): void {
    this.service.myDocumentSignedUrl(item.id).subscribe({
      next: (res) => this.openSignedDownload(res.data, item),
      error: (err) => this.actionError.set(this.code(err)),
    });
  }

  private openSignedDownload(signed: SignedUrlResponse | undefined, item: EmployeeDocument): void {
    if (!signed?.url) {
      this.actionError.set('COMMON_LOAD_ERROR');
      return;
    }
    const link = window.document.createElement('a');
    link.href = this.service.resolveSignedUrl(signed.url);
    link.download = item.file_name || item.document_type;
    link.rel = 'noopener';
    link.click();
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  statusVariant(status?: string): ColorVariant {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'CLEAN': return ColorVariant.SUCCESS;
      case 'PROBATION':
      case 'PENDING': return ColorVariant.WARNING;
      case 'LEFT':
      case 'REJECTED':
      case 'INFECTED': return ColorVariant.DANGER;
      default: return ColorVariant.DEFAULT;
    }
  }

  changesOf(request: ChangeRequest | null): string {
    return request?.changes ? JSON.stringify(request.changes, null, 2) : '{}';
  }

  changeRows(request: ChangeRequest | null): Array<{ field: string; labelKey: string; oldValue: string; newValue: string }> {
    if (!request?.changes) {
      return [];
    }
    const employee = this.requestEmployee() as Record<string, unknown> | null;
    return Object.entries(request.changes).map(([field, value]) => ({
      field,
      labelKey: this.fieldLabelKey(field),
      oldValue: this.changeValue(employee?.[field]),
      newValue: this.changeValue(value),
    }));
  }

  private changeValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private code(err: unknown): string {
    const body = (err as { error?: { code?: string } })?.error;
    return body?.code ?? 'COMMON_LOAD_ERROR';
  }
}
