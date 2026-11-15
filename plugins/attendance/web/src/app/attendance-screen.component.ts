import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AttendanceStatusBadgeComponent,
  ContextMenuComponent,
  ContextMenuItem,
  ContextMenuService,
  DateFieldComponent,
  MonthFieldComponent,
  DrawerComponent,
  FilterItem,
  FilterStripComponent,
  GpsIndicatorComponent,
  I18nService,
  IconComponent,
  LeaveBalanceCardComponent,
  PaginationComponent,
  PeriodStepperComponent,
  SharpButtonComponent,
  TableColumnsComponent,
  TableSortHeaderDirective,
  TableSortService,
  TimelineNode,
  TranslatePipe,
  formatDate,
  formatDateTime,
} from '@shared';
import {
  AttendanceLog,
  AttendanceRecord,
  AttendanceRequest,
  AttendanceStatus,
  AttendanceSummary,
  AttendanceWorkflowPolicy,
  ApprovalStepInfo,
  AuditLogEntry,
  EmployeeDirectory,
  ShiftCoverage,
  KioskDevice,
  KioskEmployee,
  LeaveBalance,
  LeaveLedgerEntry,
  LeaveType,
  PunchType,
  RequestType,
  RequestWorkflowInfo,
  ShiftDefinition,
  Timesheet,
  TimesheetClosingChecklist,
  TimesheetConfirmation,
  MyTimesheet,
  WorkflowApprovalLevel,
  WorkflowDefinitionCatalogItem,
} from './attendance.model';

export interface ScreenTabItem {
  key: AttendanceTab;
  labelKey: string;
  icon: string;
  count?: number;
  group?: 'self' | 'manager' | 'admin';
}
import { AttendanceService } from './attendance.service';

interface PluginContext {
  theme?: string;
  language?: string;
  permissions?: string[];
  platform?: string;
  user?: { id: string; name: string; email: string } | null;
  userId?: string;
  notify?: (message: string) => void;
  navigate?: (path: string) => void;
}

export type AttendanceTab =
  | 'self'
  | 'requests'
  | 'my-timesheet'
  | 'team'
  | 'approvals'
  | 'admin-logs'
  | 'admin-shifts'
  | 'admin-records'
  | 'admin-timesheets'
  | 'admin-leave'
  | 'admin-reports'
  | 'admin-workflows'
  | 'admin-kiosk'
  | 'admin-activity'
  | 'kiosk';

type MobileTab = 'm-punch' | 'm-schedule' | 'm-requests' | 'm-approvals' | 'm-confirm';

@Component({
  selector: 'app-attendance-screen',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DrawerComponent,
    AttendanceStatusBadgeComponent,
    LeaveBalanceCardComponent,
    PeriodStepperComponent,
    GpsIndicatorComponent,
    IconComponent,
    FilterStripComponent,
    SharpButtonComponent,
    PaginationComponent,
    ContextMenuComponent,
    DateFieldComponent,
    MonthFieldComponent,
    TableColumnsComponent,
    TableSortHeaderDirective,
  ],
  templateUrl: './attendance-screen.component.html',
})
export class AttendanceScreenComponent implements OnInit {
  private service = inject(AttendanceService);
  private i18n = inject(I18nService);
  private cdr = inject(ChangeDetectorRef);
  private contextMenu = inject(ContextMenuService);
  private tableSort = inject(TableSortService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly pendingRouteId = signal<string | null>(null);
  private lastEmittedRoute = '';
  private readonly routeReady = signal<boolean>(false);
  readonly Math = Math;

  @Input() context: PluginContext | null = null;
  @Input() isStandaloneKiosk: boolean = false;
  @Input() set language(value: string | undefined) {
    if (value && value !== this.i18n.currentLang()) {
      this.i18n.setLanguage(value as never);
    }
  }
  @Input('user-role') set userRoleAttr(value: string | null | undefined) {
    this.userRole.set((value || '').trim().toUpperCase() || null);
  }
  readonly userRole = signal<string | null>(null);
  @Input('is-mobile') set isMobileAttr(val: boolean | string) {
    if (val === true || val === 'true' || val === '') {
      this.isMobileView.set(true);
    }
  }
  @Input() set initialRoute(value: string) {
    if (value) {
      this.handleRoute(value);
    }
  }

  /** Host contract: plugin web components receive their sub-route via the `route` property. */
  @Input() set route(value: string) {
    if (value) {
      this.handleRoute(value);
    }
  }

  readonly toastMessage = signal<string | null>(null);

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  private copyText(value: string | null | undefined): void {
    const text = value || '';
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    this.showToast(this.i18n.instant('COMMON_COPY') + ': ' + text);
  }

  openRowContextMenu(event: MouseEvent, type: string, row: any): void {
    const items = this.rowMenuItems(type, row);
    if (!items.length) return;
    event.preventDefault();
    this.contextMenu.open({
      x: event.clientX,
      y: event.clientY,
      items,
      trigger: event.target as HTMLElement,
    });
  }

  private rowMenuItems(type: string, row: any): ContextMenuItem[] {
    switch (type) {
      case 'my-request':
        return [
          { id: 'view', labelKey: 'COMMON_VIEW_DETAIL', icon: 'eye', action: () => this.viewMyRequest(row) },
          { id: 'copy', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.request_number) },
          { id: 'new', labelKey: 'attendance.request.new', icon: 'plus', action: () => this.openNewRequestDrawer() },
        ];
      case 'inbox-request':
        return [
          { id: 'open', labelKey: 'attendance.table.code', icon: 'file-text', action: () => this.selectInboxRequest(row) },
          { id: 'copy', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.request_number) },
          { id: 'approve', labelKey: 'attendance.request.approve', icon: 'check', action: () => { this.selectInboxRequest(row); this.processApproval('APPROVE'); } },
          { id: 'reject', labelKey: 'attendance.request.reject', icon: 'x', danger: true, action: () => { this.selectInboxRequest(row); this.processApproval('REJECT'); } },
        ];
      case 'log':
        return [
          { id: 'view', labelKey: 'COMMON_VIEW_DETAIL', icon: 'eye', action: () => this.openLogDetail(row) },
          { id: 'copy-code', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.employee_code || row.employee_id) },
          { id: 'copy-time', labelKey: 'attendance.table.time', icon: 'clock', action: () => this.copyText(this.formatDateTime(row.punch_time)) },
        ];
      case 'shift':
        return [
          { id: 'view', labelKey: 'COMMON_VIEW_DETAIL', icon: 'eye', action: () => this.openShiftDetail(row) },
          { id: 'edit', labelKey: 'COMMON_EDIT', icon: 'edit-2', action: () => { this.editingShift.set({ ...row }); this.shiftDrawerOpen.set(true); } },
          { id: 'copy', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.code) },
        ];
      case 'record':
        return [
          { id: 'view', labelKey: 'COMMON_VIEW_DETAIL', icon: 'eye', action: () => this.openRecordDetail(row) },
          { id: 'employee', labelKey: 'attendance.detail.view_employee_timesheet', icon: 'calendar', action: () => this.openEmployeeRecords(row, row.work_date, row.work_date) },
          { id: 'copy', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.employee_code || row.employee_id) },
          { id: 'calc', labelKey: 'attendance.records.recalculate', icon: 'refresh-cw', action: () => this.runBatchCalculation() },
        ];
      case 'timesheet':
        return [
          { id: 'view', labelKey: 'COMMON_VIEW_DETAIL', icon: 'eye', action: () => this.selectTimesheet(row) },
          { id: 'open', labelKey: 'attendance.timesheet.open_stepper', icon: 'calendar', action: () => this.selectTimesheet(row) },
          { id: 'copy', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.name) },
          { id: 'lock', labelKey: row.locked ? 'attendance.timesheet.unlock' : 'attendance.timesheet.lock', icon: 'lock', action: () => { this.selectTimesheet(row); this.toggleLockTimesheet(); } },
          { id: 'export', labelKey: 'attendance.timesheet.export_payroll_btn', icon: 'download', action: () => { this.selectTimesheet(row); this.exportTimesheetCsv(); } },
        ];
      case 'leave-balance':
        return [
          { id: 'view', labelKey: 'COMMON_VIEW_DETAIL', icon: 'eye', action: () => this.openLeaveDetail(row) },
          { id: 'grant', labelKey: 'attendance.leave.grant_new', icon: 'plus', action: () => this.grantLeaveDrawerOpen.set(true) },
          { id: 'adjust', labelKey: 'attendance.leave.adjust', icon: 'edit-2', action: () => { this.adjustEmployeeId.set(row.employee_id); this.adjustLeaveTypeId.set(row.leave_type_id); this.adjustLeaveDrawerOpen.set(true); } },
          { id: 'copy', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.employee_name || row.employee_id) },
        ];
      case 'leave-ledger':
        return [
          { id: 'view', labelKey: 'COMMON_VIEW_DETAIL', icon: 'eye', action: () => this.openLeaveDetail(row) },
          { id: 'copy', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.employee_name || row.employee_id) },
        ];
      case 'kiosk':
        return [
          { id: 'copy', labelKey: 'attendance.kiosk.copy_branch_link', icon: 'file-text', action: () => this.copyBranchKioskLink(row) },
          { id: 'open', labelKey: 'attendance.kiosk.open_branch_kiosk', icon: 'external-link', action: () => this.openBranchKiosk(row) },
          { id: 'rotate', labelKey: 'attendance.kiosk.rotate_token', icon: 'refresh-cw', danger: true, action: () => this.rotateKioskToken(row) },
        ];
      case 'team':
      case 'report-row':
        return [
          {
            id: 'view',
            labelKey: 'attendance.detail.view_employee_timesheet',
            icon: 'calendar',
            action: () => this.openEmployeeRecords(row),
          },
          { id: 'copy', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.employee_code || row.employee_name || row.department_name) },
        ];
      case 'timesheet-employee':
        return [
          {
            id: 'view',
            labelKey: 'attendance.detail.view_employee_timesheet',
            icon: 'calendar',
            action: () =>
              this.openEmployeeRecords(
                {
                  employee_id: row.employee_id,
                  employee_code: row.employee_code,
                  full_name: row.employee_name,
                  department_name: row.department,
                },
                this.selectedTimesheet()?.period_start,
                this.selectedTimesheet()?.period_end
              ),
          },
          { id: 'copy', labelKey: 'COMMON_COPY', icon: 'file-text', action: () => this.copyText(row.employee_code) },
        ];
      default:
        return [];
    }
  }

  private toggleShiftActive(shift: ShiftDefinition): void {
    this.service.saveShift({ ...shift, is_active: !shift.is_active }).subscribe({
      next: () => {
        this.loadShifts();
        this.showToast(this.i18n.instant('COMMON_SAVE'));
      },
    });
  }

  readonly allScreenTabs: ScreenTabItem[] = [
    { key: 'self', labelKey: 'PLUGIN_ATTENDANCE_MY_ATTENDANCE', icon: 'clock', group: 'self' },
    { key: 'requests', labelKey: 'PLUGIN_ATTENDANCE_MY_REQUESTS', icon: 'file-text', group: 'self' },
    { key: 'my-timesheet', labelKey: 'PLUGIN_ATTENDANCE_MY_TIMESHEET', icon: 'calendar', group: 'self' },
    { key: 'team', labelKey: 'PLUGIN_ATTENDANCE_TEAM', icon: 'users', group: 'manager' },
    { key: 'approvals', labelKey: 'PLUGIN_ATTENDANCE_INBOX', icon: 'check-square', group: 'manager' },
    { key: 'admin-timesheets', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_TIMESHEETS', icon: 'calendar', group: 'admin' },
    { key: 'admin-shifts', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_SHIFTS', icon: 'sun', group: 'admin' },
    { key: 'admin-records', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_RECORDS', icon: 'clipboard', group: 'admin' },
    { key: 'admin-logs', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_LOGS', icon: 'list', group: 'admin' },
    { key: 'admin-leave', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_LEAVE', icon: 'award', group: 'admin' },
    { key: 'admin-reports', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_REPORTS', icon: 'bar-chart-2', group: 'admin' },
    { key: 'admin-workflows', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_WORKFLOWS', icon: 'git-branch', group: 'admin' },
    { key: 'admin-kiosk', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_KIOSK', icon: 'tablet', group: 'admin' },
    { key: 'admin-activity', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_ACTIVITY', icon: 'list', group: 'admin' },
  ];

  readonly screenTabs = computed<ScreenTabItem[]>(() => {
    const role = this.userRole() || this.roleFromContext();
    const visible = this.visibleTabKeys(role);
    const countFor = (key: AttendanceTab): number | undefined => {
      if (key === 'requests') return this.myRequestsList().length;
      if (key === 'approvals') return this.inboxRequestsList().length;
      return undefined;
    };
    return this.allScreenTabs
      .filter((tab) => !visible || visible.has(tab.key))
      .map((tab) => ({ ...tab, count: countFor(tab.key) }));
  });

  readonly activeRole = computed(() => this.userRole() || this.roleFromContext());
  readonly canApprove = computed(() => this.screenTabs().some((tab) => tab.key === 'approvals'));
  readonly canSeeCompanyPunches = computed(() => {
    const role = this.activeRole();
    return role !== 'EMPLOYEE' && role !== 'STAFF';
  });
  readonly canExportAdmin = computed(() => this.screenTabs().some((tab) => tab.key === 'admin-reports'));

  private roleFromContext(): string | null {
    const permissions = this.context?.permissions || [];
    if (!permissions.length) {
      return null;
    }
    const adminPermissions = [
      'attendance:settings:manage',
      'attendance:timesheet:manage',
      'attendance:timesheet:lock',
      'attendance:leave:manage',
      'attendance:log:manage',
      'attendance:shift:manage',
      'attendance:report:read',
    ];
    if (permissions.some((permission) => adminPermissions.includes(permission))) {
      return 'HR_ADMIN';
    }
    if (permissions.includes('attendance:request:approve') || permissions.includes('attendance:record:read')) {
      return 'LINE_MANAGER';
    }
    return 'EMPLOYEE';
  }

  private visibleTabKeys(role: string | null): Set<AttendanceTab> | null {    if (!role) {
      return null;
    }
    if (role === 'EMPLOYEE' || role === 'STAFF') {
      return new Set<AttendanceTab>(['self', 'requests', 'my-timesheet']);
    }
    if (role === 'LINE_MANAGER' || role === 'MANAGER' || role === 'TEAM_LEADER') {
      return new Set<AttendanceTab>(['self', 'requests', 'my-timesheet', 'team', 'approvals']);
    }
    if (role === 'HR_MANAGER') {
      return new Set<AttendanceTab>([
        'self', 'requests', 'my-timesheet', 'team', 'approvals', 'admin-timesheets', 'admin-shifts',
        'admin-records', 'admin-logs', 'admin-leave', 'admin-reports', 'admin-activity',
      ]);
    }
    if (role === 'HR_ADMIN' || role === 'SYSTEM_ADMIN' || role === 'TENANT_ADMIN' || role === 'TENANT_OWNER') {
      return new Set<AttendanceTab>(this.allScreenTabs.map((tab) => tab.key));
    }
    return null;
  }

  constructor() {
    effect(() => {
      const tabs = this.screenTabs();
      if (!tabs.some((tab) => tab.key === this.activeTab())) {
        this.activeTab.set('self');
      }
    });

    effect(() => {
      if (!this.routeReady() || this.isStandaloneKioskMode()) {
        return;
      }
      const route = this.buildRoute();
      if (route === this.lastEmittedRoute || typeof CustomEvent === 'undefined') {
        return;
      }
      this.lastEmittedRoute = route;
      this.hostElement.nativeElement.dispatchEvent(
        new CustomEvent('op:route-change', { detail: { path: route }, bubbles: true })
      );
    });
  }

  selectTab(tab: AttendanceTab): void {
    this.activeTab.set(tab);
    this.applyDrawer(null);
    if (tab === 'requests') {
      this.loadMyRequests();
    }
    if (tab === 'my-timesheet') {
      this.loadMyTimesheets();
    }
    if (tab === 'team') {
      this.loadReports();
    }
    if (tab === 'approvals') {
      this.loadInbox();
    }
    if (tab === 'admin-timesheets') {
      this.loadTimesheets();
      this.loadNeedsReviewCount();
    }
    if (tab === 'admin-records' && this.adminRecordsList().length === 0) {
      this.loadAdminRecords();
    }
    if (tab === 'admin-logs' && this.adminLogsList().length === 0) {
      this.loadAdminLogs();
    }
    if (tab === 'admin-reports') {
      this.loadReports();
    }
    if (tab === 'admin-leave') {
      this.loadAdminLeave();
    }
    if (tab === 'admin-activity') {
      this.loadAuditLogs();
    }
    if (tab === 'admin-shifts') {
      this.loadShifts();
    }
    if (tab === 'admin-kiosk') {
      this.loadKioskDevices();
    }
  }

  openCreateRequestDrawer(): void {
    this.newRequestDrawerOpen.set(true);
  }

  exportTimesheets(): void {
    this.showToast('Đã xuất dữ liệu bảng chấm công kỳ 11/2026 định dạng CSV thành công.');
  }

  // Active view states
  readonly activeTab = signal<AttendanceTab>('self');
  readonly activeMobileTab = signal<MobileTab>('m-punch');
  readonly isMobileView = signal<boolean>(false);
  readonly isStandaloneKioskMode = signal<boolean>(false);
  readonly currentTimeString = signal<string>('08:02:14');
  readonly currentDateString = signal<string>('Thứ Tư, 11/11/2026');
  readonly loading = signal<boolean>(false);
  readonly busy = signal<boolean>(false);
  readonly kpiExpanded = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Self & Punch
  readonly todayStatus = signal<AttendanceStatus>('ABSENT');
  readonly lastPunch = signal<AttendanceLog | null>(null);
  readonly currentShift = signal<ShiftDefinition | null>(null);
  readonly weekSchedule = signal<Array<{ date: string; day: string; shift?: string; status?: AttendanceStatus }>>([]);
  readonly myLogsList = signal<AttendanceLog[]>([]);
  readonly myLeaveBalances = signal<LeaveBalance[]>([]);
  readonly myPersonalLeaveBalances = computed(() => {
    const list = this.myLeaveBalances();
    if (!list.length) {
      return [];
    }
    const userName = this.context?.user?.name?.trim().toLowerCase();
    if (userName) {
      const mine = list.filter((b) => (b.employee_name || '').trim().toLowerCase() === userName);
      if (mine.length) {
        return mine;
      }
    }
    const firstEmployeeId = list[0]?.employee_id;
    return list.filter((b) => b.employee_id === firstEmployeeId);
  });

  // GPS state
  readonly gpsLoading = signal<boolean>(false);
  readonly gpsLat = signal<number | null>(null);
  readonly gpsLng = signal<number | null>(null);
  readonly gpsAccuracy = signal<number | null>(null);
  readonly gpsDistance = signal<number | null>(null);
  readonly gpsInside = signal<boolean | null>(null);
  readonly punchNote = signal<string>('');

  // Requests
  readonly myRequestsList = signal<AttendanceRequest[]>([]);
  readonly requestTypeFilter = signal<string>('ALL');
  readonly requestStatusFilter = signal<string>('ALL');
  readonly requestDateFrom = signal<string>('');
  readonly requestDateTo = signal<string>('');
  readonly selectedMyRequest = signal<AttendanceRequest | null>(null);
  readonly myRequestDrawerOpen = signal<boolean>(false);
  readonly filteredMyRequests = computed(() => {
    const type = this.requestTypeFilter();
    const status = this.requestStatusFilter();
    const from = this.requestDateFrom();
    const to = this.requestDateTo();
    return this.myRequestsList().filter((req) => {
      if (type !== 'ALL' && req.request_type_code !== type) return false;
      if (status !== 'ALL' && req.status !== status) return false;
      const day = (req.submitted_at || '').slice(0, 10);
      if (from && day && day < from) return false;
      if (to && day && day > to) return false;
      return true;
    });
  });
  readonly myRequestsPaged = computed(() =>
    this.slicePage(this.tableSort.sortRows('my-requests', this.filteredMyRequests()), this.myRequestsPage(), this.myRequestsSize())
  );
  readonly myRequestTimeline = computed<TimelineNode[]>(() => {
    const req = this.selectedMyRequest();
    if (!req) return [];
    const nodes: TimelineNode[] = [
      {
        title: this.i18n.instant('attendance.request.submitted'),
        status: 'SUBMITTED',
        actorName: req.employee_name || '',
        timestamp: req.submitted_at,
        isDone: true,
      },
    ];
    if (req.status === 'PENDING') {
      nodes.push({
        title: this.i18n.instant('attendance.request.pending_approval'),
        status: 'PENDING',
        actorName: '',
        timestamp: null,
        isDone: false,
      });
    } else {
      nodes.push({
        title: this.i18n.instant('attendance.request.approval_result'),
        status: req.status,
        actorName: '',
        timestamp: req.approved_at,
        comment: req.comment || undefined,
        isDone: req.status === 'APPROVED',
        isFailed: req.status === 'REJECTED',
      });
    }
    return nodes;
  });
  readonly myRequestPayload = computed<Array<{ key: string; value: string }>>(() => {
    const req = this.selectedMyRequest();
    const data = (req?.response || req?.data || {}) as Record<string, unknown>;
    return Object.entries(data).map(([key, value]) => ({
      key,
      value: value === null || value === undefined
        ? ''
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value),
    }));
  });
  readonly requestTypesList = signal<RequestType[]>([]);
  readonly newRequestDrawerOpen = signal<boolean>(false);
  readonly selectedRequestTypeCode = signal<string>('LEAVE');
  readonly requestFromDate = signal<string>('');
  readonly requestToDate = signal<string>('');
  readonly requestReason = signal<string>('');
  readonly requestCustomHours = signal<number>(8);

  // Inbox & Approvals
  readonly inboxRequestsList = signal<AttendanceRequest[]>([]);
  readonly approvalsRequestTypeFilter = signal<string>('ALL');
  readonly approvalTypeFilterItems = computed<ReadonlyArray<FilterItem<string>>>(() => {
    const allCount = this.inboxRequestsList().length;
    const leaveCount = this.inboxRequestsList().filter((r) => r.request_type_code === 'LEAVE').length;
    const otCount = this.inboxRequestsList().filter((r) => r.request_type_code === 'OVERTIME').length;
    const tripCount = this.inboxRequestsList().filter((r) => r.request_type_code === 'BUSINESS_TRIP').length;
    const fixCount = this.inboxRequestsList().filter((r) => r.request_type_code === 'ATTENDANCE_FIX').length;
    const lateCount = this.inboxRequestsList().filter((r) => r.request_type_code === 'LATE_EARLY').length;
    const swapCount = this.inboxRequestsList().filter((r) => r.request_type_code === 'SHIFT_SWAP').length;

    return [
      { id: 'ALL', labelKey: 'attendance.approvals.filter_type_all', count: allCount, testId: 'btn-filter-type-all' },
      { id: 'LEAVE', labelKey: 'attendance.approvals.filter_type_leave', count: leaveCount, testId: 'btn-filter-type-leave' },
      { id: 'OVERTIME', labelKey: 'attendance.approvals.filter_type_ot', count: otCount, testId: 'btn-filter-type-overtime' },
      { id: 'BUSINESS_TRIP', labelKey: 'attendance.approvals.filter_type_trip', count: tripCount, testId: 'btn-filter-type-business_trip' },
      { id: 'ATTENDANCE_FIX', labelKey: 'attendance.approvals.filter_type_fix', count: fixCount, testId: 'btn-filter-type-attendance_fix' },
      { id: 'LATE_EARLY', labelKey: 'attendance.approvals.filter_type_late', count: lateCount, testId: 'btn-filter-type-late_early' },
      { id: 'SHIFT_SWAP', labelKey: 'attendance.approvals.filter_type_swap', count: swapCount, testId: 'btn-filter-type-shift_swap' },
    ];
  });
  readonly kioskDeptFilterItems: ReadonlyArray<FilterItem<string>> = [
    { id: 'ALL', labelKey: 'attendance.kiosk.filter_all', testId: 'btn-kiosk-filter-ALL' },
    { id: 'Kỹ thuật', labelKey: 'attendance.kiosk.filter_tech', testId: 'btn-kiosk-filter-Kỹ thuật' },
    { id: 'Sản xuất', labelKey: 'attendance.kiosk.filter_prod', testId: 'btn-kiosk-filter-Sản xuất' },
    { id: 'Kinh doanh', labelKey: 'attendance.kiosk.filter_sales', testId: 'btn-kiosk-filter-Kinh doanh' },
    { id: 'Nhân sự', labelKey: 'attendance.kiosk.filter_hr', testId: 'btn-kiosk-filter-Nhân sự' },
  ];
  readonly filteredInboxRequests = computed(() => {
    const list = this.inboxRequestsList();
    const filter = this.approvalsRequestTypeFilter();
    const term = this.inboxSearch().trim().toLowerCase();
    return list.filter((request) => {
      if (filter !== 'ALL' && request.request_type_code !== filter) return false;
      if (term) {
        const haystack = `${request.request_number || ''} ${request.employee_name || ''} ${request.employee_code || ''} ${request.request_type_name || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  });
  readonly inboxSearch = signal<string>('');
  readonly inboxPage = signal<number>(0);
  readonly inboxSize = signal<number>(100);
  readonly inboxPaged = computed(() =>
    this.slicePage(this.tableSort.sortRows('approvals-inbox', this.filteredInboxRequests()), this.inboxPage(), this.inboxSize())
  );
  readonly selectedInboxRequest = signal<AttendanceRequest | null>(null);
  readonly approvalComment = signal<string>('');
  readonly inboxTimelineNodes = signal<TimelineNode[]>([]);
  readonly approvalsViewMode = signal<'inbox' | 'workflow_catalog'>('inbox');
  readonly selectedRequestWorkflow = signal<RequestWorkflowInfo | null>(null);


  // Admin Logs
  readonly adminLogsList = signal<AttendanceLog[]>([]);
  readonly adminLogsTotal = signal<number>(0);
  readonly adminLogsPage = signal<number>(0);
  readonly adminLogsSize = signal<number>(100);
  readonly logSearch = signal<string>('');
  readonly logSourceFilter = signal<string>('ALL');
  readonly logFrom = signal<string>('');
  readonly logTo = signal<string>('');
  readonly filteredLogs = computed(() => {
    const term = this.logSearch().trim().toLowerCase();
    const source = this.logSourceFilter();
    return this.adminLogsList().filter((log) => {
      if (source !== 'ALL' && log.source !== source) return false;
      if (term) {
        const haystack = (log.employee_code || '') + ' ' + (log.employee_name || '');
        if (!haystack.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  });
  readonly pageSizeOptions = [10, 20, 50, 100];
  readonly adminLogsPaged = computed(() =>
    this.slicePage(this.tableSort.sortRows('logs', this.filteredLogs()), this.adminLogsPage(), this.adminLogsSize())
  );
  readonly logsLoading = signal<boolean>(false);
  private logsSeq = 0;
  readonly selectedLogDetail = signal<AttendanceLog | null>(null);
  readonly logDetailDrawerOpen = signal<boolean>(false);

  // Pagination state (0-based for app-pagination, converted to 1-based at API calls)
  readonly myLogsPage = signal<number>(0);
  readonly myLogsSize = signal<number>(100);
  readonly myLogsTotal = signal<number>(0);
  readonly myRequestsPage = signal<number>(0);
  readonly myRequestsSize = signal<number>(100);
  readonly myRequestsTotal = signal<number>(0);
  readonly teamPage = signal<number>(0);
  readonly teamSize = signal<number>(100);
  readonly adminRecordsPage = signal<number>(0);
  readonly adminRecordsSize = signal<number>(100);
  readonly recordSearch = signal<string>('');
  readonly recordNeedsReviewOnly = signal<boolean>(false);
  readonly filteredRecords = computed(() => {
    const term = this.recordSearch().trim().toLowerCase();
    const needsReview = this.recordNeedsReviewOnly();
    return this.adminRecordsList().filter((record) => {
      if (needsReview && !record.needs_review) return false;
      if (term) {
        const haystack = (record.employee_code || '') + ' ' + (record.employee_name || '');
        if (!haystack.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  });
  readonly sortedRecords = computed(() => this.tableSort.sortRows('records', this.filteredRecords()));
  readonly recordDate = signal<string>(new Date().toISOString().slice(0, 10));
  readonly adminRecordsTotal = signal<number>(0);
  readonly leaveBalancesPage = signal<number>(0);
  readonly leaveBalancesSize = signal<number>(100);
  readonly leaveBalancesTotal = signal<number>(0);
  readonly leaveLedgerPage = signal<number>(0);
  readonly leaveLedgerSize = signal<number>(100);
  readonly leaveLedgerTotal = signal<number>(0);
  readonly timesheetsPage = signal<number>(0);
  readonly timesheetsSize = signal<number>(100);
  readonly timesheetsTotal = signal<number>(0);
  readonly shiftsPage = signal<number>(0);
  readonly shiftsSize = signal<number>(100);
  readonly kioskDevicesPage = signal<number>(0);
  readonly kioskDevicesSize = signal<number>(100);
  readonly timesheetSummaryPage = signal<number>(0);
  readonly timesheetSummarySize = signal<number>(100);

  readonly myLogsPaged = computed(() => this.slicePage(this.tableSort.sortRows('my-logs', this.myLogsList()), this.myLogsPage(), this.myLogsSize()));
  readonly teamFrom = signal<string>('');
  readonly teamTo = signal<string>('');
  readonly teamDepartmentFilter = signal<string>('ALL');
  readonly teamSearch = signal<string>('');
  readonly teamDepartments = computed(() => {
    const names = new Set<string>();
    this.teamMetricsList().forEach((item) => {
      if (item.department_name) names.add(item.department_name);
    });
    return Array.from(names).sort();
  });
  readonly filteredTeam = computed(() => {
    const department = this.teamDepartmentFilter();
    const term = this.teamSearch().trim().toLowerCase();
    return this.teamMetricsList().filter((item) => {
      if (department !== 'ALL' && item.department_name !== department) return false;
      if (term) {
        const haystack = (item.employee_code || '') + ' ' + (item.full_name || '');
        if (!haystack.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  });
  readonly teamPaged = computed(() => this.slicePage(this.tableSort.sortRows('team', this.filteredTeam()), this.teamPage(), this.teamSize()));
  readonly shiftSearch = signal<string>('');
  readonly shiftStatusFilter = signal<string>('ALL');
  readonly filteredShifts = computed(() => {
    const status = this.shiftStatusFilter();
    const term = this.shiftSearch().trim().toLowerCase();
    return this.shiftsList().filter((shift) => {
      if (status === 'ACTIVE' && !shift.is_active) return false;
      if (status === 'INACTIVE' && shift.is_active) return false;
      if (term) {
        const haystack = (shift.code || '') + ' ' + (shift.name || '');
        if (!haystack.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  });
  readonly shiftsPaged = computed(() => this.slicePage(this.tableSort.sortRows('shifts', this.filteredShifts()), this.shiftsPage(), this.shiftsSize()));
  readonly kioskPaged = computed(() => this.slicePage(this.tableSort.sortRows('kiosk', this.filteredKioskDevices()), this.kioskDevicesPage(), this.kioskDevicesSize()));
  readonly timesheetSummaryPaged = computed(() =>
    this.slicePage(this.tableSort.sortRows('timesheet-summary', this.filteredTimesheetSummaries()), this.timesheetSummaryPage(), this.timesheetSummarySize()),
  );
  readonly timesheetEmployeeSearch = signal<string>('');
  readonly timesheetDepartmentFilter = signal<string>('ALL');
  readonly timesheetDepartmentOptions = computed(() => {
    const names = new Set<string>();
    this.timesheetEmployeeSummaries().forEach((row) => {
      if (row.department) names.add(row.department);
    });
    return Array.from(names).sort();
  });
  readonly filteredTimesheetSummaries = computed(() => {
    const term = this.timesheetEmployeeSearch().trim().toLowerCase();
    const department = this.timesheetDepartmentFilter();
    return this.timesheetEmployeeSummaries().filter((row) => {
      if (department !== 'ALL' && row.department !== department) return false;
      if (term) {
        const haystack = `${row.employee_code || ''} ${row.employee_name || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  });

  private slicePage<T>(list: T[], page: number, size: number): T[] {
    const start = Math.max(0, page) * Math.max(1, size);
    return list.slice(start, start + Math.max(1, size));
  }
  readonly importLogsDrawerOpen = signal<boolean>(false);
  readonly importCsvText = signal<string>('');

  submitImportLogs(): void {
    const csv = this.importCsvText().trim();
    if (!csv) {
      this.showToast(this.i18n.instant('attendance.logs.import_empty'));
      return;
    }
    this.service.importLogs(csv).subscribe({
      next: (res) => {
        const imported = res.data?.imported ?? 0;
        const errors = res.data?.errors?.length ?? 0;
        this.showToast(this.i18n.instant('attendance.logs.import_success', { imported, errors }));
        this.importLogsDrawerOpen.set(false);
        this.importCsvText.set('');
        this.loadInitialData();
      },
      error: () => this.showToast(this.i18n.instant('attendance.logs.import_error')),
    });
  }

  // Admin Shifts
  readonly shiftsList = signal<ShiftDefinition[]>([]);
  readonly shiftDrawerOpen = signal<boolean>(false);
  readonly editingShift = signal<Partial<ShiftDefinition>>({
    code: '',
    name: '',
    start_time: '08:00',
    end_time: '17:00',
    grace_in_minutes: 15,
    grace_out_minutes: 15,
    work_hours: 8,
    is_active: true,
  });

  // Admin Records
  readonly adminRecordsList = signal<AttendanceRecord[]>([]);
  readonly overrideDrawerOpen = signal<boolean>(false);
  readonly selectedRecordToOverride = signal<AttendanceRecord | null>(null);
  readonly overrideStatus = signal<AttendanceStatus>('PRESENT');
  readonly overrideReason = signal<string>('');
  readonly selectedRecordDetail = signal<AttendanceRecord | null>(null);
  readonly recordDetailDrawerOpen = signal<boolean>(false);
  readonly recordsLoading = signal<boolean>(false);

  // My timesheet (self-service periods + daily records)
  readonly myTimesheetPeriods = signal<MyTimesheet[]>([]);
  readonly selectedMyPeriod = signal<MyTimesheet | null>(null);
  readonly myDailyRecords = signal<AttendanceRecord[]>([]);
  readonly sortedMyDailyRecords = computed(() => this.tableSort.sortRows('my-timesheet-records', this.myDailyRecords()));
  readonly myPeriodSummary = computed(() => {
    const records = this.myDailyRecords();
    let actualDays = 0;
    let paidLeaveDays = 0;
    let otMinutes = 0;
    let lateMinutes = 0;
    let workedMinutes = 0;
    for (const record of records) {
      if (record.status === 'PRESENT' || record.status === 'WFH' || record.status === 'BUSINESS_TRIP') {
        actualDays += 1;
      } else if (record.status === 'HALF_DAY') {
        actualDays += 0.5;
      } else if (record.status === 'ON_LEAVE') {
        paidLeaveDays += 1;
      }
      otMinutes += record.ot_hours * 60;
      lateMinutes += record.late_minutes || 0;
      workedMinutes += record.work_hours * 60;
    }
    const standardDays = records.filter((record) => {
      const parsed = new Date(record.work_date);
      const day = parsed.getDay();
      return day !== 0 && day !== 6;
    }).length;
    return {
      standard_days: standardDays,
      actual_days: actualDays,
      paid_leave_days: paidLeaveDays,
      ot_hours: Math.round((otMinutes / 60) * 10) / 10,
      late_minutes: lateMinutes,
      worked_hours: Math.round((workedMinutes / 60) * 10) / 10,
      total_days: actualDays + paidLeaveDays,
    };
  });

  // Admin Timesheets
  readonly timesheetsList = signal<Timesheet[]>([]);
  readonly timesheetView = signal<'periods' | 'detail'>('periods');
  readonly timesheetYearFilter = signal<string>('ALL');
  readonly timesheetStatusFilter = signal<string>('ALL');
  readonly timesheetSearch = signal<string>('');
  readonly filteredTimesheets = computed(() => {
    const year = this.timesheetYearFilter();
    const status = this.timesheetStatusFilter();
    const term = this.timesheetSearch().trim().toLowerCase();
    return this.timesheetsList().filter((ts) => {
      if (year !== 'ALL' && String(ts.period_year) !== year) return false;
      if (status === 'LOCKED' && !ts.locked) return false;
      if (status === 'OPEN' && ts.locked) return false;
      if (term && !(ts.name || '').toLowerCase().includes(term)) return false;
      return true;
    });
  });
  readonly timesheetsPaged = computed(() =>
    this.slicePage(this.tableSort.sortRows('timesheets', this.filteredTimesheets()), this.timesheetsPage(), this.timesheetsSize())
  );
  readonly timesheetYearOptions = computed(() => {
    const years = new Set<string>();
    this.timesheetsList().forEach((ts) => {
      if (ts.period_year) years.add(String(ts.period_year));
    });
    return Array.from(years).sort().reverse();
  });
  readonly selectedTimesheet = signal<Timesheet | null>(null);
  readonly newTimesheetDrawerOpen = signal<boolean>(false);
  readonly newTimesheetYear = signal<number>(new Date().getFullYear());
  readonly newTimesheetMonth = signal<number>(new Date().getMonth() + 1);
  readonly monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
  readonly lockReason = signal<string>('');
  readonly lockDrawerOpen = signal<boolean>(false);
  readonly timesheetConfirmationsList = signal<TimesheetConfirmation[]>([]);

  // Bulk shift assignment
  readonly bulkAssignDrawerOpen = signal<boolean>(false);
  readonly bulkAssignShiftId = signal<string>('');
  readonly bulkAssignMonth = signal<string>(new Date().toISOString().slice(0, 7));
  readonly bulkAssignBranch = signal<string>('ALL');
  readonly bulkAssignDepartment = signal<string>('ALL');
  readonly bulkAssignSearch = signal<string>('');
  readonly bulkAssignSelected = signal<Set<string>>(new Set());
  readonly employeeDirectoryList = signal<EmployeeDirectory[]>([]);
  readonly shiftCoverageList = signal<ShiftCoverage[]>([]);
  readonly coverageMonth = signal<string>(new Date().toISOString().slice(0, 7));
  readonly shiftCoverageMap = computed(() => {
    const map = new Map<string, ShiftCoverage>();
    this.shiftCoverageList().forEach((coverage) => map.set(coverage.shift_definition_id, coverage));
    return map;
  });
  readonly bulkBranches = computed(() => {
    const names = new Set<string>();
    this.employeeDirectoryList().forEach((employee) => {
      if (employee.branch_name) names.add(employee.branch_name);
    });
    return Array.from(names).sort();
  });
  readonly bulkDepartments = computed(() => {
    const names = new Set<string>();
    this.employeeDirectoryList().forEach((employee) => {
      if (employee.department_name) names.add(employee.department_name);
    });
    return Array.from(names).sort();
  });
  readonly bulkEmployees = computed(() => {
    const branch = this.bulkAssignBranch();
    const department = this.bulkAssignDepartment();
    const term = this.bulkAssignSearch().trim().toLowerCase();
    return this.employeeDirectoryList().filter((employee) => {
      if ((employee.employment_status || 'ACTIVE').toUpperCase() !== 'ACTIVE') return false;
      if (branch !== 'ALL' && employee.branch_name !== branch) return false;
      if (department !== 'ALL' && employee.department_name !== department) return false;
      if (term) {
        const haystack = `${employee.employee_code || ''} ${employee.full_name || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  });
  readonly bulkAllSelected = computed(() => {
    const selected = this.bulkAssignSelected();
    const employees = this.bulkEmployees();
    return employees.length > 0 && employees.every((employee) => selected.has(employee.employee_id));
  });

  // Employee attendance detail drawer (team report + timesheet rows)
  readonly employeeRecordTarget = signal<EmployeeDirectory | null>(null);
  readonly employeeRecordList = signal<AttendanceRecord[]>([]);
  readonly employeeRecordDrawerOpen = signal<boolean>(false);
  readonly employeeRecordFrom = signal<string>('');
  readonly employeeRecordTo = signal<string>('');
  readonly employeeRecordsLoading = signal<boolean>(false);
  readonly selectedShiftDetail = signal<ShiftDefinition | null>(null);
  readonly shiftDetailDrawerOpen = signal<boolean>(false);
  readonly selectedLeaveDetail = signal<Record<string, unknown> | null>(null);
  readonly leaveDetailDrawerOpen = signal<boolean>(false);

  // Report filters
  readonly reportFrom = signal<string>(new Date().toISOString().slice(0, 7));
  readonly reportTo = signal<string>(new Date().toISOString().slice(0, 7));
  readonly reportDepartment = signal<string>('ALL');
  readonly reportSearch = signal<string>('');
  readonly reportDepartments = computed(() => {
    const names = new Set<string>();
    this.teamMetricsList().forEach((item) => {
      if (item.department_name) names.add(item.department_name);
    });
    return Array.from(names).sort();
  });
  readonly filteredTeamReport = computed(() => this.filterReportRows(this.teamMetricsList()));
  readonly filteredTopLate = computed(() => this.tableSort.sortRows('report-top-late', this.filterReportRows(this.topLateList())));
  readonly filteredOvertime = computed(() => this.tableSort.sortRows('report-overtime', this.filterReportRows(this.overtimeList())));

  // Leave types & grants
  readonly employeesList = signal<Array<{ employee_id: string; employee_code: string; full_name: string }>>([]);
  readonly newLeaveTypeDrawerOpen = signal<boolean>(false);
  readonly newLeaveTypeCode = signal<string>('');
  readonly newLeaveTypeName = signal<string>('');
  readonly newLeaveTypeDays = signal<number>(12);
  readonly grantNote = signal<string>('');

  // Activity trail (plugin audit)
  readonly auditLogsList = signal<AuditLogEntry[]>([]);
  readonly sortedAuditLogs = computed(() => this.tableSort.sortRows('audit', this.auditLogsList()));
  readonly auditPage = signal<number>(0);
  readonly auditSize = signal<number>(100);
  readonly auditTotal = signal<number>(0);
  readonly auditActionFilter = signal<string>('ALL');
  readonly auditEntityFilter = signal<string>('ALL');
  readonly auditColumnOptions = [
    { key: 'created_at', labelKey: 'attendance.table.time' },
    { key: 'action', labelKey: 'attendance.audit.action' },
    { key: 'entity', labelKey: 'attendance.audit.target' },
    { key: 'detail', labelKey: 'attendance.audit.detail' },
  ];
  readonly auditColumns = signal<string[]>(['created_at', 'action', 'entity', 'detail']);
  readonly auditHiddenColumns = signal<string[]>([]);
  readonly auditActionOptions = computed(() =>
    Array.from(new Set(this.auditLogsList().map((log) => log.action).filter(Boolean))).sort(),
  );
  readonly auditEntityOptions = computed(() =>
    Array.from(new Set(this.auditLogsList().map((log) => log.entity_type || '').filter(Boolean))).sort(),
  );
  readonly auditVisibleColumns = computed(() =>
    this.auditColumns().filter((key) => !this.auditHiddenColumns().includes(key)),
  );

  // Kiosk admin filters & column config
  readonly kioskAdminSearch = signal<string>('');
  readonly kioskAdminStatus = signal<string>('ALL');
  kioskColumnOptions = [
    { key: 'branch', labelKey: 'attendance.kiosk.branch_name' },
    { key: 'device_code', labelKey: 'attendance.kiosk.device_code' },
    { key: 'location', labelKey: 'attendance.kiosk.location' },
    { key: 'ip', labelKey: 'attendance.kiosk.ip_address' },
    { key: 'status', labelKey: 'attendance.table.status' },
    { key: 'scope', labelKey: 'attendance.kiosk.scope' },
    { key: 'today_punches', labelKey: 'attendance.kiosk.today_punches' },
    { key: 'actions', labelKey: 'attendance.table.actions' },
  ];
  kioskSortKey(column: string): string {
    const map: Record<string, string> = {
      branch: 'branch_name',
      device_code: 'device_code',
      location: 'location_name',
      ip: 'ip_address',
      status: 'status',
      today_punches: 'today_punches',
    };
    return map[column] || '';
  }
  kioskAlignCenter(column: string): boolean {
    return ['status', 'today_punches', 'actions'].includes(column);
  }
  readonly kioskColumns = signal<string[]>([
    'branch', 'device_code', 'location', 'ip', 'status', 'scope', 'today_punches', 'actions',
  ]);
  readonly kioskHiddenColumns = signal<string[]>([]);
  readonly kioskVisibleColumns = computed(() =>
    this.kioskColumns().filter((key) => !this.kioskHiddenColumns().includes(key)),
  );
  readonly filteredKioskDevices = computed(() => {
    const term = this.kioskAdminSearch().trim().toLowerCase();
    const status = this.kioskAdminStatus();
    return this.kioskDevicesList().filter((device) => {
      if (status !== 'ALL' && device.status !== status) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = `${device.device_code} ${device.location_name} ${device.branch_name} ${device.branch_code}`;
      return haystack.toLowerCase().includes(term);
    });
  });

  // Workflow catalog filters, pagination & column config
  readonly workflowSearch = signal<string>('');
  readonly workflowStatus = signal<string>('ALL');
  readonly workflowColumnOptions = [
    { key: 'name', labelKey: 'attendance.request.type' },
    { key: 'code', labelKey: 'attendance.workflows.type_code' },
    { key: 'definition', labelKey: 'attendance.workflows.definition' },
    { key: 'window_days', labelKey: 'attendance.workflows.window_days' },
    { key: 'status', labelKey: 'attendance.table.status' },
  ];
  readonly workflowsPage = signal<number>(0);
  readonly workflowsSize = signal<number>(100);
  readonly workflowColumns = signal<string[]>(['name', 'code', 'definition', 'window_days', 'status']);
  readonly workflowHiddenColumns = signal<string[]>([]);
  readonly workflowVisibleColumns = computed(() =>
    this.workflowColumns().filter((key) => !this.workflowHiddenColumns().includes(key)),
  );
  readonly filteredRequestTypes = computed(() => {
    const term = this.workflowSearch().trim().toLowerCase();
    const status = this.workflowStatus();
    return this.requestTypesList().filter((type) => {
      if (status === 'ACTIVE' && !type.is_active) return false;
      if (status === 'INACTIVE' && type.is_active) return false;
      if (!term) return true;
      return `${type.name} ${type.code} ${type.workflow_definition_key || ''}`.toLowerCase().includes(term);
    });
  });
  readonly workflowsPaged = computed(() =>
    this.slicePage(
      this.tableSort.sortRows('workflows', this.filteredRequestTypes()),
      this.workflowsPage(),
      this.workflowsSize(),
    ),
  );

  // Timesheet Period Closing Pipeline (derived from live data)
  readonly needsReviewTotal = signal<number>(0);
  readonly timesheetClosingChecklist = computed<TimesheetClosingChecklist>(() => {
    const pending = this.inboxRequestsList();
    const countType = (...codes: string[]) =>
      pending.filter((request) => codes.includes(request.request_type_code)).length;
    const confirmations = this.timesheetConfirmationsList();
    const confirmed = confirmations.filter((item) => item.status === 'CONFIRMED').length;
    const disputes = confirmations.filter((item) => item.status === 'REJECTED').length;
    const step = this.selectedTimesheet()?.step;
    return {
      pending_leaves: countType('LEAVE'),
      pending_ot: countType('OVERTIME'),
      pending_trips: countType('BUSINESS_TRIP'),
      pending_fixes: countType('ATTENDANCE_FIX', 'LATE_EARLY', 'SHIFT_SWAP'),
      unresolved_anomalies: this.needsReviewTotal(),
      dispute_count: disputes,
      all_requests_resolved: pending.length === 0,
      anomalies_resolved: this.needsReviewTotal() === 0,
      calculation_completed: step === 'S3_CALCULATE' || step === 'S4_ADJUST' || step === 'DONE',
      disputes_resolved: confirmed > 0 && disputes === 0,
      is_ready_to_lock: step === 'S4_ADJUST' && disputes === 0 && pending.length === 0,
    };
  });
  readonly pendingRequestTotal = computed(() => this.inboxRequestsList().length);

  readonly timesheetEmployeeSummaries = computed<Array<{
    employee_id: string;
    employee_code: string;
    employee_name: string;
    department: string;
    std_days: number;
    actual_days: number;
    leave_paid_days: number;
    ot_hours: number;
    trip_days: number;
    late_minutes: number;
    total_paid_days: number;
  }>>(() => {
    const employees = this.selectedTimesheet()?.snapshot?.employees || [];
    const departments = new Map<string, string>();
    this.teamMetricsList().forEach((item) => {
      if (item.employee_code) departments.set(item.employee_code, item.department_name || '');
    });
    return employees.map((emp) => ({
      employee_id: emp.employee_id,
      employee_code: emp.employee_code || '',
      employee_name: emp.full_name || '',
      department: departments.get(emp.employee_code || '') || '',
      std_days: Number(emp.standard_days ?? 0),
      actual_days: Number(emp.actual_days ?? 0),
      leave_paid_days: Number(emp.paid_leave_days ?? 0),
      ot_hours: Number(emp.ot_hours ?? 0),
      trip_days: 0,
      late_minutes: Number(emp.late_minutes ?? 0),
      total_paid_days: Number(emp.actual_days ?? 0) + Number(emp.paid_leave_days ?? 0),
    }));
  });

  readonly timesheetEmployeeCount = computed(() => {
    const snapshot = this.selectedTimesheet()?.snapshot;
    if (typeof snapshot?.total_employees === 'number') {
      return snapshot.total_employees;
    }
    return snapshot?.employees?.length || 0;
  });

  readonly timesheetConfirmedCount = computed(
    () => this.timesheetConfirmationsList().filter((item) => item.status === 'CONFIRMED').length
  );

  readonly currentMyTimesheet = computed(() => this.selectedTimesheet() || this.timesheetsList()[0] || null);
  readonly myTimesheetSummary = computed(() => {
    const list = this.timesheetEmployeeSummaries();
    const userName = this.context?.user?.name?.trim().toLowerCase();
    if (!userName) {
      return null;
    }
    return list.find((row) => row.employee_name.toLowerCase() === userName) || null;
  });

  // Admin Leave
  readonly leaveView = signal<'types' | 'balances' | 'ledger'>('types');
  readonly leaveSearch = signal<string>('');
  readonly leaveTypeFilter = signal<string>('ALL');
  readonly leaveEntryFilter = signal<string>('ALL');
  readonly leaveTypeStatusFilter = signal<string>('ALL');
  readonly leaveTypesPage = signal<number>(0);
  readonly leaveTypesSize = signal<number>(100);
  readonly filteredLeaveTypes = computed(() => {
    const term = this.leaveSearch().trim().toLowerCase();
    const status = this.leaveTypeStatusFilter();
    return this.leaveTypesList().filter((type) => {
      if (status === 'ACTIVE' && !type.is_active) return false;
      if (status === 'INACTIVE' && type.is_active) return false;
      if (term) {
        const haystack = `${type.code || ''} ${type.name || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  });
  readonly leaveTypesPaged = computed(() =>
    this.slicePage(this.tableSort.sortRows('leave-types', this.filteredLeaveTypes()), this.leaveTypesPage(), this.leaveTypesSize())
  );
  readonly filteredLeaveBalances = computed(() => {
    const term = this.leaveSearch().trim().toLowerCase();
    const type = this.leaveTypeFilter();
    return this.adminLeaveBalancesList().filter((balance) => {
      if (type !== 'ALL' && balance.leave_type_id !== type) return false;
      if (term) {
        const haystack = (balance.employee_name || '') + ' ' + (balance.employee_id || '');
        if (!haystack.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  });
  readonly filteredLeaveLedger = computed(() => {
    const term = this.leaveSearch().trim().toLowerCase();
    const type = this.leaveTypeFilter();
    const entry = this.leaveEntryFilter();
    return this.leaveLedgerList().filter((row) => {
      if (type !== 'ALL' && row.leave_type_id !== type) return false;
      if (entry !== 'ALL' && row.entry_type !== entry) return false;
      if (term) {
        const haystack = (row.employee_name || '') + ' ' + (row.employee_id || '');
        if (!haystack.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  });
  readonly leaveBalancesPaged = computed(() =>
    this.slicePage(this.tableSort.sortRows('leave-balances', this.filteredLeaveBalances()), this.leaveBalancesPage(), this.leaveBalancesSize())
  );
  readonly leaveLedgerPaged = computed(() =>
    this.slicePage(this.tableSort.sortRows('leave-ledger', this.filteredLeaveLedger()), this.leaveLedgerPage(), this.leaveLedgerSize())
  );
  readonly leaveTypesList = signal<LeaveType[]>([]);
  readonly adminLeaveBalancesList = signal<LeaveBalance[]>([]);
  readonly leaveLedgerList = signal<LeaveLedgerEntry[]>([]);
  readonly grantLeaveDrawerOpen = signal<boolean>(false);
  readonly grantEmployeeId = signal<string>('');
  readonly grantLeaveTypeId = signal<string>('');
  readonly grantDays = signal<number>(12);
  readonly grantValidUntil = signal<string>('');
  readonly adjustLeaveDrawerOpen = signal<boolean>(false);
  readonly adjustEmployeeId = signal<string>('');
  readonly adjustLeaveTypeId = signal<string>('');
  readonly adjustDays = signal<number>(0);
  readonly adjustReason = signal<string>('');

  // Admin Reports
  readonly summaryMetrics = signal<AttendanceSummary | null>(null);
  readonly todaySummary = signal<AttendanceSummary | null>(null);
  readonly today = new Date().toISOString().slice(0, 10);
  readonly teamMetricsList = signal<any[]>([]);
  readonly teamPaidLeaveTotal = computed(() =>
    this.teamMetricsList().reduce((sum, item) => sum + Number(item.paid_leave_days || 0), 0)
  );
  readonly topLateList = signal<any[]>([]);
  readonly overtimeList = signal<any[]>([]);

  // Kiosk Devices & Management by Branch
  readonly kioskDevicesList = signal<KioskDevice[]>([]);
  readonly kioskDrawerOpen = signal<boolean>(false);
  readonly kioskNewDeviceCode = signal<string>('');
  readonly kioskNewDeviceName = signal<string>('');
  readonly kioskNewBranchId = signal<string>('');
  readonly kioskNewPin = signal<string>('123456');
  readonly kioskLinks = signal<Record<string, string>>({});
  readonly kioskCreatedLink = signal<string>('');
  readonly kioskBranchOptions = computed(() => {
    const options = new Map<string, string>();
    this.employeeDirectoryList().forEach((employee) => {
      if (employee.branch_id && employee.branch_name) {
        options.set(employee.branch_id, employee.branch_name);
      }
    });
    return Array.from(options, ([id, name]) => ({ id, name }));
  });

  readonly kioskBranchCount = computed(
    () => new Set(this.kioskDevicesList().map((device) => device.branch_code || 'UNASSIGNED')).size
  );
  readonly kioskOnlineCount = computed(() => this.kioskDevicesList().filter((d) => d.status === 'ONLINE').length);
  readonly kioskTodayPunches = computed(() => this.kioskDevicesList().reduce((sum, d) => sum + (d.today_punches || 0), 0));

  loadKioskDevices(): void {
    if (this.employeeDirectoryList().length === 0) {
      this.loadEmployeeDirectory();
    }
    this.service.devices().subscribe({
      next: (res) => {
        this.kioskDevicesList.set(
          (res.data?.items || []).map((device: any) => {
            const branch = this.employeeDirectoryList().find((employee) => employee.branch_id === device.branch_id);
            return {
              id: device.id,
              device_code: device.device_code,
              location_name: device.name || device.device_code,
              branch_id: device.branch_id,
              branch_code: device.branch_id || 'UNASSIGNED',
              branch_name: branch?.branch_name || device.name || device.device_code,
              ip_address: '',
              status: device.is_active ? 'ONLINE' : 'OFFLINE',
              device_token: '',
              today_punches: 0,
              last_heartbeat: device.updated_at || device.created_at || '',
              public_url: this.kioskLinks()[device.id] || (device.public_token ? this.kioskLink(device.device_code, device.public_token) : ''),
              allowed_departments: [],
            };
          })
        );
      },
      error: () => this.kioskDevicesList.set([]),
    });
  }

  openKioskDrawer(): void {
    this.kioskNewDeviceCode.set(`KIOSK-${Date.now().toString(36).toUpperCase().slice(-6)}`);
    this.kioskNewDeviceName.set('');
    this.kioskNewBranchId.set(this.kioskBranchOptions()[0]?.id || '');
    this.kioskNewPin.set('123456');
    this.kioskCreatedLink.set('');
    if (this.employeeDirectoryList().length === 0) {
      this.loadEmployeeDirectory();
    }
    this.kioskDrawerOpen.set(true);
  }

  createKioskDevice(): void {
    const code = this.kioskNewDeviceCode().trim();
    if (!code) {
      return;
    }
    this.loading.set(true);
    this.service
      .createDevice({
        device_code: code,
        name: this.kioskNewDeviceName().trim() || code,
        branch_id: this.kioskNewBranchId() || null,
        pin: this.kioskNewPin().trim() || null,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          const token = res.data?.device_token as string | undefined;
          const id = res.data?.id as string | undefined;
          if (token && id) {
            const link = this.kioskLink(code, token);
            this.kioskLinks.update((all) => ({ ...all, [id]: link }));
            this.kioskCreatedLink.set(link);
          }
          this.loadKioskDevices();
          this.kioskDrawerOpen.set(false);
          this.successMessage.set(this.i18n.instant('attendance.kiosk.device_created'));
          setTimeout(() => this.successMessage.set(null), 4000);
        },
        error: () => {
          this.loading.set(false);
          this.showToast(this.i18n.instant('COMMON_SAVE_ERROR'));
        },
      });
  }

  kioskLink(deviceCode: string, token: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const slug = this.kioskTenantSlug();
    if (slug) {
      const root = typeof document !== 'undefined' ? document.documentElement : null;
      const mode = root?.classList.contains('dark') ? 'dark' : 'light';
      const themeId = root?.getAttribute('data-theme') || '';
      const query = [
        `device=${encodeURIComponent(deviceCode)}`,
        `token=${encodeURIComponent(token)}`,
        `mode=${mode}`,
        themeId ? `theme=${encodeURIComponent(themeId)}` : '',
      ].filter(Boolean).join('&');
      return `${origin}/public/kiosk/${encodeURIComponent(slug)}/${encodeURIComponent(deviceCode)}?${query}`;
    }
    return `${origin}/settings/apps/attendance/kiosk?device=${encodeURIComponent(deviceCode)}&token=${encodeURIComponent(token)}`;
  }

  private kioskTenantSlug(): string {
    if (typeof localStorage === 'undefined') return '';
    try {
      const raw = localStorage.getItem('openerp_user');
      if (!raw) return '';
      const user = JSON.parse(raw) as { tenant_slug?: string };
      return (user.tenant_slug || '').trim();
    } catch {
      return '';
    }
  }

  copyKioskLink(link: string): void {
    if (!link) return;
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    this.showToast(link);
  }

  openKioskLink(link: string): void {
    if (link && typeof window !== 'undefined') {
      window.open(link, '_blank');
    }
  }

  private kioskHref(url: string): string {
    return url.startsWith('/kiosk') ? `/settings/apps/attendance${url}` : url;
  }

  copyBranchKioskLink(device: KioskDevice): void {
    if (!device.public_url) {
      this.showToast(
        this.i18n.instant('attendance.kiosk.link_unavailable', { device: device.device_code })
      );
      return;
    }
    const fullUrl = (typeof window !== 'undefined' ? window.location.origin : '') + this.kioskHref(device.public_url);
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl).catch(() => {});
    }
    this.showToast(fullUrl);
  }

  openBranchKiosk(device: KioskDevice): void {
    if (device.public_url && typeof window !== 'undefined') {
      window.open(this.kioskHref(device.public_url), '_blank');
    }
  }

  rotateKioskToken(device: KioskDevice): void {
    this.service.rotateDeviceToken(device.id).subscribe({
      next: (res) => {
        const token = res.data?.public_token || res.data?.device_token;
        if (!token) {
          this.showToast(this.i18n.instant('attendance.kiosk.link_unavailable', { device: device.device_code }));
          return;
        }
        const link = this.kioskLink(device.device_code, token);
        this.kioskLinks.update((all) => ({ ...all, [device.id]: link }));
        this.kioskCreatedLink.set(link);
        this.loadKioskDevices();
        this.successMessage.set(this.i18n.instant('attendance.kiosk.token_rotated'));
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: () => this.showToast(this.i18n.instant('COMMON_SAVE_ERROR')),
    });
  }






















  // Kiosk Terminal Mode State — Synced with Employee Plugin Directory
  readonly kioskEmployeesList = signal<KioskEmployee[]>([]);

  readonly kioskBranchFilter = signal<string>('ALL');
  readonly currentKioskBranch = computed(() => {
    const code = this.kioskBranchFilter();
    if (code === 'BRANCH-HN') {
      return {
        code: 'BRANCH-HN',
        name: 'Chi nhánh Hà Nội',
        location: 'Sảnh Lễ tân Tòa Keangnam (Tầng 1)',
        device: 'KIOSK-HN-01',
      };
    }
    if (code === 'BRANCH-HCM') {
      return {
        code: 'BRANCH-HCM',
        name: 'Chi nhánh TP. Hồ Chí Minh',
        location: 'Sảnh Văn phòng Bitexco Q1 (Tầng 18)',
        device: 'KIOSK-HCM-01',
      };
    }
    if (code === 'BRANCH-BD') {
      return {
        code: 'BRANCH-BD',
        name: 'Nhà máy Sản xuất Bình Dương',
        location: 'Cổng Kiểm soát KCN VSIP 1',
        device: 'KIOSK-BD-01',
      };
    }
    return {
      code: 'ALL',
      name: 'Toàn hệ thống Acme Corp',
      location: 'Tất cả Chi nhánh',
      device: 'KIOSK-GLOBAL',
    };
  });
  readonly allEmployees = computed(() => this.kioskEmployeesList());
  readonly todayPunchesCount = computed(() => this.kioskEmployeesList().filter((e) => e.punched_today).length);
  readonly kioskDeviceCode = signal<string>('');
  readonly kioskPublicToken = signal<string>('');
  readonly kioskSessionToken = signal<string>('');
  readonly kioskAccessDenied = signal<boolean>(false);
  readonly kioskDeptFilter = signal<string>('ALL');
  readonly kioskAlphabetFilter = signal<string>('ALL');
  readonly kioskSearchTerm = signal<string>('');
  readonly kioskPage = signal<number>(1);
  readonly kioskPageSize = signal<number>(12);
  readonly alphabetLetters = [
    'ALL', 'A', 'B', 'C', 'D', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'Q', 'S', 'T', 'V', 'X', 'Y'
  ];

  readonly selectedKioskEmployee = signal<KioskEmployee | null>(null);

  readonly filteredKioskEmployees = computed(() => {
    let list = this.kioskEmployeesList();
    const branch = this.kioskDeviceCode() ? 'ALL' : this.kioskBranchFilter();
    if (branch && branch !== 'ALL') {
      list = list.filter((e) => e.branch_code === branch);
    }
    const dept = this.kioskDeptFilter();
    const letter = this.kioskAlphabetFilter().toUpperCase();
    const term = this.kioskSearchTerm().trim().toLowerCase();

    if (dept !== 'ALL') {
      list = list.filter((e) => e.department.toLowerCase().includes(dept.toLowerCase()));
    }
    if (letter !== 'ALL') {
      list = list.filter((e) => {
        const parts = e.name.trim().split(/\s+/);
        const lastName = parts[parts.length - 1].toUpperCase();
        const firstName = parts[0].toUpperCase();
        return lastName.startsWith(letter) || firstName.startsWith(letter);
      });
    }
    if (term) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.code.toLowerCase().includes(term) ||
          (e.job_title && e.job_title.toLowerCase().includes(term))
      );
    }
    return list;
  });

  readonly kioskTotalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredKioskEmployees().length / this.kioskPageSize()));
  });

  readonly paginatedKioskEmployees = computed(() => {
    const list = this.filteredKioskEmployees();
    const start = (this.kioskPage() - 1) * this.kioskPageSize();
    return list.slice(start, start + this.kioskPageSize());
  });

  setKioskDept(dept: string): void {
    this.kioskDeptFilter.set(dept);
    this.kioskPage.set(1);
  }

  setKioskAlphabet(letter: string): void {
    this.kioskAlphabetFilter.set(letter);
    this.kioskPage.set(1);
  }

  onKioskSearchChange(term: string): void {
    this.kioskSearchTerm.set(term);
    this.kioskPage.set(1);
  }

  nextKioskPage(): void {
    if (this.kioskPage() < this.kioskTotalPages()) {
      this.kioskPage.update((p) => p + 1);
      this.triggerKioskSlide('next');
    }
  }

  prevKioskPage(): void {
    if (this.kioskPage() > 1) {
      this.kioskPage.update((p) => p - 1);
      this.triggerKioskSlide('prev');
    }
  }

  // Touch swipe support for kiosk touchscreens / tablets
  readonly kioskDragOffset = signal<number>(0);
  readonly kioskDragging = signal<boolean>(false);
  readonly kioskSlideDirection = signal<'next' | 'prev' | ''>('');
  private kioskSlideTimer?: ReturnType<typeof setTimeout>;
  private kioskTouchStartX = 0;
  private kioskTouchStartY = 0;

  private triggerKioskSlide(direction: 'next' | 'prev'): void {
    this.kioskSlideDirection.set(direction);
    if (this.kioskSlideTimer) {
      clearTimeout(this.kioskSlideTimer);
    }
    this.kioskSlideTimer = setTimeout(() => this.kioskSlideDirection.set(''), 320);
  }

  onKioskTouchStart(event: TouchEvent): void {
    if (event.touches && event.touches.length > 0) {
      this.kioskTouchStartX = event.touches[0].clientX;
      this.kioskTouchStartY = event.touches[0].clientY;
      this.kioskDragging.set(true);
      this.kioskDragOffset.set(0);
    }
  }

  onKioskTouchMove(event: TouchEvent): void {
    if (!this.kioskDragging() || !event.touches || event.touches.length === 0) {
      return;
    }
    const deltaX = event.touches[0].clientX - this.kioskTouchStartX;
    const deltaY = event.touches[0].clientY - this.kioskTouchStartY;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }
    // Rubber-band the grid under the finger (max 120px).
    this.kioskDragOffset.set(Math.max(-120, Math.min(120, deltaX)));
  }

  onKioskTouchEnd(event: TouchEvent): void {
    if (event.changedTouches && event.changedTouches.length > 0) {
      const endX = event.changedTouches[0].clientX;
      const endY = event.changedTouches[0].clientY;
      const deltaX = endX - this.kioskTouchStartX;
      const deltaY = endY - this.kioskTouchStartY;
      this.kioskDragging.set(false);
      this.kioskDragOffset.set(0);
      // Horizontal swipe detected if deltaX is larger than deltaY * 1.5 and over 50px
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          this.nextKioskPage();
        } else {
          this.prevKioskPage();
        }
      }
    }
  }

  selectKioskEmployee(emp: KioskEmployee): void {
    this.selectedKioskEmployee.set(emp);
    this.kioskEmployeeCode.set(emp.code);
    this.kioskPin.set('');
    this.kioskSuccessMessage.set(null);
    this.kioskErrorMessage.set(null);
  }

  backToKioskEmployeeGrid(): void {
    this.selectedKioskEmployee.set(null);
    this.kioskEmployeeCode.set('');
    this.kioskPin.set('');
    this.kioskSuccessMessage.set(null);
    this.kioskErrorMessage.set(null);
  }

  readonly kioskEmployeeCode = signal<string>('');
  readonly kioskPin = signal<string>('');
  readonly kioskSuccessMessage = signal<string | null>(null);
  readonly kioskErrorMessage = signal<string | null>(null);

  loadKioskEmployees(): void {
    const deviceCode = this.kioskDeviceCode();
    const token = this.kioskPublicToken();
    if (!deviceCode || !token) {
      this.kioskAccessDenied.set(true);
      this.kioskEmployeesList.set([]);
      return;
    }
    this.service.kioskEmployees(deviceCode, token).subscribe({
      next: (res) => {
        if (res.data?.items) {
          this.kioskEmployeesList.set(res.data.items);
        }
        this.kioskAccessDenied.set(false);
      },
      error: () => {
        this.kioskEmployeesList.set([]);
        this.kioskAccessDenied.set(true);
      },
    });
  }

  // Responsive & Permission checks
  readonly isMobile = computed(() => {
    return this.isMobileView() || this.context?.platform === 'mobile';
  });

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
  }

  ngOnInit(): void {
    void this.i18n.refreshAllDictionaries().then(() => this.cdr.detectChanges()).catch(() => undefined);
    this.checkViewport();
    this.checkKioskMode();
    this.routeReady.set(true);
    this.updateClock();
    if (typeof window !== 'undefined') {
      setInterval(() => this.updateClock(), 1000);
    }
    this.loadInitialData();
    this.acquireGps();
  }

  private checkKioskMode(): void {
    if (this.isStandaloneKiosk) {
      this.isStandaloneKioskMode.set(true);
    }
    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '';
      const search = window.location.search || '';
      const isAdminKiosk = path.endsWith('/admin/kiosk');
      if (!isAdminKiosk && (path.endsWith('/kiosk') || search.includes('kiosk=true'))) {
        this.isStandaloneKioskMode.set(true);
      } else if (!this.isStandaloneKiosk) {
        this.isStandaloneKioskMode.set(false);
      }
      if (this.isStandaloneKioskMode()) {
        const params = new URLSearchParams(search);
        const branch = params.get('branch');
        const device = params.get('device');
        const token = params.get('token');
        if (branch) {
          this.kioskBranchFilter.set(branch);
        }
        if (!device || !token) {
          this.kioskAccessDenied.set(true);
          this.kioskEmployeesList.set([]);
          return;
        }
        this.kioskDeviceCode.set(device);
        this.kioskPublicToken.set(token);
      }
    }
  }

  formatDate(val: string | number | Date | null | undefined): string {
    return formatDate(val, this.i18n.currentLang());
  }

  formatTime(val: string | number | Date | null | undefined): string {
    if (!val) {
      return '—';
    }
    const parsed = new Date(val);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  }

  isToday(value: string | null | undefined): boolean {
    if (!value) {
      return false;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return false;
    }
    const today = new Date();
    return parsed.getFullYear() === today.getFullYear()
      && parsed.getMonth() === today.getMonth()
      && parsed.getDate() === today.getDate();
  }

  timesheetStepKey(step: string): string {
    const map: Record<string, string> = {
      S1_LOGS: 'attendance.timesheet.step.s1_logs',
      S2_SCHEDULE: 'attendance.timesheet.step.s2_schedule',
      S3_CALCULATE: 'attendance.timesheet.step.s3_calculate',
      S4_ADJUST: 'attendance.timesheet.step.s4_adjust',
      DONE: 'attendance.timesheet.step.done',
    };
    return map[step] || 'attendance.timesheet.status_open';
  }

  formatDateTime(val: string | number | Date | null | undefined): string {
    return formatDateTime(val, this.i18n.currentLang());
  }

  private updateClock(): void {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.currentTimeString.set(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    try {
      const locale = this.i18n.currentLang() || 'vi';
      this.currentDateString.set(
        new Intl.DateTimeFormat(locale, {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).format(now)
      );
    } catch {
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[now.getDay()];
      this.currentDateString.set(`${dayName}, ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`);
    }
  }

  openWorkflowDesigner(): void {
    if (this.context?.navigate) {
      this.context.navigate('/settings/apps/workflow');
      return;
    }
    if (typeof CustomEvent === 'undefined') {
      return;
    }
    this.hostElement.nativeElement.dispatchEvent(
      new CustomEvent('op:navigate', {
        detail: { path: '/settings/apps/workflow' },
        bubbles: true,
      })
    );
  }

  openPublicKiosk(): void {
    const device = this.kioskDevicesList().find((item) => Boolean(item.public_url));
    if (device?.public_url) {
      this.openKioskLink(device.public_url);
      return;
    }
    this.openKioskDrawer();
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobileView.set(window.innerWidth < 768);
    }
  }

  private handleRoute(route: string): void {
    const [path, query] = route.split('?');
    const params = new URLSearchParams(query || '');
    const branch = params.get('branch');
    if (branch) {
      this.kioskBranchFilter.set(branch);
    }

    const tabParam = params.get('tab') as AttendanceTab | null;
    if (tabParam && this.allScreenTabs.some((item) => item.key === tabParam)) {
      this.activeTab.set(tabParam);
      if (tabParam === 'kiosk') {
        this.isStandaloneKioskMode.set(true);
      }
    } else if (path.includes('kiosk')) {
      this.isStandaloneKioskMode.set(true);
      this.activeTab.set('kiosk');
    } else if (path.includes('/admin/timesheets')) {
      this.activeTab.set('admin-timesheets');
    } else if (path.includes('/admin/shifts')) {
      this.activeTab.set('admin-shifts');
    } else if (path.includes('/admin/records')) {
      this.activeTab.set('admin-records');
    } else if (path.includes('/admin/leave')) {
      this.activeTab.set('admin-leave');
    } else if (path.includes('/admin/reports')) {
      this.activeTab.set('admin-reports');
    } else if (path.includes('/admin/workflows')) {
      this.activeTab.set('admin-workflows');
    } else if (path.includes('/admin/kiosk')) {
      this.activeTab.set('admin-kiosk');
    } else if (path.includes('/admin/activity')) {
      this.activeTab.set('admin-activity');
    } else if (path.includes('/admin/logs')) {
      this.activeTab.set('admin-logs');
    } else if (path.includes('/requests')) {
      this.activeTab.set('requests');
      this.activeMobileTab.set('m-requests');
    } else if (path.includes('/my-timesheet')) {
      this.activeTab.set('my-timesheet');
    } else if (path.includes('/approvals')) {
      this.activeTab.set('approvals');
      this.activeMobileTab.set('m-approvals');
    } else if (path.includes('/team')) {
      this.activeTab.set('team');
    } else if (path !== '' && path !== '/') {
      this.activeTab.set('self');
      this.activeMobileTab.set('m-punch');
    }

    const mtab = params.get('mtab') as MobileTab | null;
    if (mtab) {
      this.activeMobileTab.set(mtab);
    }

    if (path.endsWith('/kiosk') && !path.endsWith('/admin/kiosk')) {
      this.isStandaloneKioskMode.set(true);
    }
    if (this.activeTab() !== 'kiosk' && !path.endsWith('/kiosk')) {
      this.isStandaloneKioskMode.set(false);
    }
    if (path.endsWith('/admin/kiosk')) {
      this.isStandaloneKioskMode.set(false);
    }

    this.applyDrawer(params.get('drawer'));

    const sub = params.get('sub');
    if (this.activeTab() === 'admin-timesheets' && (sub === 'periods' || sub === 'detail')) {
      this.timesheetView.set(sub);
    }
    const leaveView = params.get('lv');
    if (this.activeTab() === 'admin-leave' && (leaveView === 'types' || leaveView === 'balances' || leaveView === 'ledger')) {
      this.leaveView.set(leaveView);
    }
    if (params.get('lt')) this.leaveTypeFilter.set(params.get('lt') as string);
    if (params.get('le')) this.leaveEntryFilter.set(params.get('le') as string);
    if (params.get('lq') !== null) this.leaveSearch.set(params.get('lq') as string);

    if (this.activeTab() === 'admin-timesheets') {
      if (params.get('ty')) this.timesheetYearFilter.set(params.get('ty') as string);
      if (params.get('ts')) this.timesheetStatusFilter.set(params.get('ts') as string);
      if (params.get('tq') !== null) this.timesheetSearch.set(params.get('tq') as string);
    }
    if (this.activeTab() === 'requests') {
      if (params.get('rt')) this.requestTypeFilter.set(params.get('rt') as string);
      if (params.get('rs')) this.requestStatusFilter.set(params.get('rs') as string);
      if (params.get('rf') !== null) this.requestDateFrom.set(params.get('rf') as string);
      if (params.get('rto') !== null) this.requestDateTo.set(params.get('rto') as string);
    }
    if (this.activeTab() === 'team') {
      if (params.get('tf') !== null) this.teamFrom.set(params.get('tf') as string);
      if (params.get('tto') !== null) this.teamTo.set(params.get('tto') as string);
      if (params.get('td')) this.teamDepartmentFilter.set(params.get('td') as string);
      if (params.get('tq') !== null) this.teamSearch.set(params.get('tq') as string);
      if (params.get('tf') || params.get('tto')) this.applyTeamRange();
    }
    if (this.activeTab() === 'admin-shifts') {
      if (params.get('ss')) this.shiftStatusFilter.set(params.get('ss') as string);
      if (params.get('sq') !== null) this.shiftSearch.set(params.get('sq') as string);
      if (params.get('cm')) {
        this.coverageMonth.set(params.get('cm') as string);
        this.loadShiftCoverage();
      }
    }
    if (this.activeTab() === 'admin-records') {
      const workDate = params.get('work_date');
      if (workDate) {
        this.recordDate.set(workDate);
        this.loadAdminRecords();
      }
      if (params.get('rq') !== null) this.recordSearch.set(params.get('rq') as string);
      this.recordNeedsReviewOnly.set(params.get('review') === '1');
    }
    if (this.activeTab() === 'admin-logs') {
      if (params.get('ls')) this.logSourceFilter.set(params.get('ls') as string);
      if (params.get('lf') !== null) this.logFrom.set(params.get('lf') as string);
      if (params.get('lto') !== null) this.logTo.set(params.get('lto') as string);
      if (params.get('lq') !== null) this.logSearch.set(params.get('lq') as string);
      if (params.get('ls') || params.get('lf') || params.get('lto')) this.loadAdminLogs();
    }
    if (this.activeTab() === 'admin-reports') {
      if (params.get('rfm')) this.reportFrom.set(params.get('rfm') as string);
      if (params.get('rtm')) this.reportTo.set(params.get('rtm') as string);
      if (params.get('rd')) this.reportDepartment.set(params.get('rd') as string);
      if (params.get('rq') !== null) this.reportSearch.set(params.get('rq') as string);
      if (params.get('rfm') || params.get('rtm')) this.applyReportRange();
    }

    const id = params.get('id');
    if (id) {
      this.pendingRouteId.set(id);
    }

    const page = Number(params.get('page'));
    const size = Number(params.get('size'));
    if (Number.isFinite(page) && page >= 0) {
      const paging = this.pagingSignals(this.activeTab());
      if (paging) {
        paging.page.set(page);
        if (Number.isFinite(size) && size > 0) {
          paging.size.set(size);
        }
      }
    }

    const tab = this.activeTab();
    if (tab === 'admin-logs' && this.adminLogsList().length === 0) this.loadAdminLogs();
    if (tab === 'admin-records' && this.adminRecordsList().length === 0) this.loadAdminRecords();
    if (tab === 'admin-leave' && this.leaveTypesList().length === 0) this.loadAdminLeave();
    if (tab === 'admin-activity' && this.auditLogsList().length === 0) this.loadAuditLogs();
    if (tab === 'admin-kiosk' && this.kioskDevicesList().length === 0) this.loadKioskDevices();
    if (tab === 'approvals' && this.inboxRequestsList().length === 0) this.loadInbox();
    if (tab === 'admin-timesheets' && this.timesheetsList().length === 0) this.loadTimesheets();
    if (tab === 'team' && this.teamMetricsList().length === 0) this.loadReports();

    this.applyPendingSelection();
  }

  /** Serialize the current screen state so reload/back/forward restores it. */
  private buildRoute(): string {
    const tab = this.activeTab();
    const params = new URLSearchParams();
    params.set('tab', tab);

    const drawer = this.openDrawerName();
    if (drawer) {
      params.set('drawer', drawer);
    }

    const id =
      tab === 'approvals'
        ? this.selectedInboxRequest()?.id
        : tab === 'admin-timesheets'
          ? this.selectedTimesheet()?.id
          : tab === 'requests'
            ? this.selectedMyRequest()?.id
            : null;
    if (id) {
      params.set('id', id);
    }

    if (tab === 'admin-timesheets') {
      params.set('sub', this.timesheetView());
      if (this.timesheetYearFilter() !== 'ALL') params.set('ty', this.timesheetYearFilter());
      if (this.timesheetStatusFilter() !== 'ALL') params.set('ts', this.timesheetStatusFilter());
      if (this.timesheetSearch()) params.set('tq', this.timesheetSearch());
    }
    if (tab === 'admin-leave') {
      params.set('lv', this.leaveView());
      if (this.leaveTypeFilter() !== 'ALL') params.set('lt', this.leaveTypeFilter());
      if (this.leaveEntryFilter() !== 'ALL') params.set('le', this.leaveEntryFilter());
      if (this.leaveSearch()) params.set('lq', this.leaveSearch());
    }
    if (tab === 'requests') {
      if (this.requestTypeFilter() !== 'ALL') params.set('rt', this.requestTypeFilter());
      if (this.requestStatusFilter() !== 'ALL') params.set('rs', this.requestStatusFilter());
      if (this.requestDateFrom()) params.set('rf', this.requestDateFrom());
      if (this.requestDateTo()) params.set('rto', this.requestDateTo());
    }
    if (tab === 'team') {
      if (this.teamFrom()) params.set('tf', this.teamFrom());
      if (this.teamTo()) params.set('tto', this.teamTo());
      if (this.teamDepartmentFilter() !== 'ALL') params.set('td', this.teamDepartmentFilter());
      if (this.teamSearch()) params.set('tq', this.teamSearch());
    }
    if (tab === 'admin-shifts') {
      if (this.shiftStatusFilter() !== 'ALL') params.set('ss', this.shiftStatusFilter());
      if (this.shiftSearch()) params.set('sq', this.shiftSearch());
    }
    if (tab === 'admin-records') {
      if (this.recordDate()) params.set('work_date', this.recordDate());
      if (this.recordSearch()) params.set('rq', this.recordSearch());
      if (this.recordNeedsReviewOnly()) params.set('review', '1');
    }
    if (tab === 'admin-logs') {
      if (this.logSourceFilter() !== 'ALL') params.set('ls', this.logSourceFilter());
      if (this.logFrom()) params.set('lf', this.logFrom());
      if (this.logTo()) params.set('lto', this.logTo());
      if (this.logSearch()) params.set('lq', this.logSearch());
    }
    if (tab === 'admin-shifts') {
      params.set('cm', this.coverageMonth());
    }
    if (tab === 'admin-reports') {
      params.set('rfm', this.reportFrom());
      params.set('rtm', this.reportTo());
      if (this.reportDepartment() !== 'ALL') params.set('rd', this.reportDepartment());
      if (this.reportSearch()) params.set('rq', this.reportSearch());
    }

    const paging = this.pagingSignals(tab);
    if (paging) {
      params.set('page', String(paging.page()));
      params.set('size', String(paging.size()));
    }

    if (this.isMobileView()) {
      params.set('mtab', this.activeMobileTab());
    }

    return `${this.tabPath(tab)}?${params.toString()}`;
  }

  private tabPath(tab: AttendanceTab): string {
    switch (tab) {
      case 'requests':
        return '/requests';
      case 'my-timesheet':
        return '/my-timesheet';
      case 'team':
        return '/team';
      case 'approvals':
        return '/approvals';
      case 'admin-timesheets':
        return '/admin/timesheets';
      case 'admin-shifts':
        return '/admin/shifts';
      case 'admin-records':
        return '/admin/records';
      case 'admin-logs':
        return '/admin/logs';
      case 'admin-leave':
        return '/admin/leave';
      case 'admin-reports':
        return '/admin/reports';
      case 'admin-workflows':
        return '/admin/workflows';
      case 'admin-kiosk':
        return '/admin/kiosk';
      case 'admin-activity':
        return '/admin/activity';
      case 'kiosk':
        return '/kiosk';
      default:
        return '/';
    }
  }

  private openDrawerName(): string {
    if (this.myRequestDrawerOpen()) return 'my-request';
    if (this.newRequestDrawerOpen()) return 'new-request';
    if (this.importLogsDrawerOpen()) return 'import-logs';
    if (this.shiftDrawerOpen()) return 'shift';
    if (this.overrideDrawerOpen()) return 'record-override';
    if (this.newTimesheetDrawerOpen()) return 'new-timesheet';
    if (this.lockDrawerOpen()) return 'lock-timesheet';
    if (this.bulkAssignDrawerOpen()) return 'bulk-assign';
    if (this.newLeaveTypeDrawerOpen()) return 'leave-type';
    if (this.grantLeaveDrawerOpen()) return 'grant-leave';
    if (this.adjustLeaveDrawerOpen()) return 'adjust-leave';
    return '';
  }

  private applyDrawer(name: string | null): void {
    this.myRequestDrawerOpen.set(name === 'my-request');
    this.newRequestDrawerOpen.set(name === 'new-request');
    this.importLogsDrawerOpen.set(name === 'import-logs');
    this.shiftDrawerOpen.set(name === 'shift');
    this.overrideDrawerOpen.set(name === 'record-override');
    this.newTimesheetDrawerOpen.set(name === 'new-timesheet');
    this.lockDrawerOpen.set(name === 'lock-timesheet');
    this.bulkAssignDrawerOpen.set(name === 'bulk-assign');
    this.newLeaveTypeDrawerOpen.set(name === 'leave-type');
    this.grantLeaveDrawerOpen.set(name === 'grant-leave');
    this.adjustLeaveDrawerOpen.set(name === 'adjust-leave');
  }

  private pagingSignals(tab: AttendanceTab): { page: WritableSignal<number>; size: WritableSignal<number> } | null {
    switch (tab) {
      case 'self':
        return { page: this.myLogsPage, size: this.myLogsSize };
      case 'requests':
        return { page: this.myRequestsPage, size: this.myRequestsSize };
      case 'team':
        return { page: this.teamPage, size: this.teamSize };
      case 'admin-timesheets':
        return { page: this.timesheetsPage, size: this.timesheetsSize };
      case 'admin-shifts':
        return { page: this.shiftsPage, size: this.shiftsSize };
      case 'admin-records':
        return { page: this.adminRecordsPage, size: this.adminRecordsSize };
      case 'admin-logs':
        return { page: this.adminLogsPage, size: this.adminLogsSize };
      case 'admin-kiosk':
        return { page: this.kioskDevicesPage, size: this.kioskDevicesSize };
      case 'admin-activity':
        return { page: this.auditPage, size: this.auditSize };
      case 'admin-leave':
        return { page: this.leaveBalancesPage, size: this.leaveBalancesSize };
      default:
        return null;
    }
  }

  /** Applies a deep-linked record id once its list has loaded. */
  private applyPendingSelection(): void {
    const id = this.pendingRouteId();
    if (!id) {
      return;
    }
    const inboxMatch = this.inboxRequestsList().find((item) => item.id === id);
    if (inboxMatch) {
      this.selectInboxRequest(inboxMatch);
      this.pendingRouteId.set(null);
      return;
    }
    const timesheetMatch = this.timesheetsList().find((item) => item.id === id);
    if (timesheetMatch) {
      this.selectTimesheet(timesheetMatch);
      this.pendingRouteId.set(null);
      return;
    }
    const myRequest = this.myRequestsList().find((item) => item.id === id);
    if (myRequest) {
      this.viewMyRequest(myRequest);
      this.pendingRouteId.set(null);
    }
  }

  loadInitialData(): void {
    if (this.isStandaloneKioskMode()) {
      this.loadKioskEmployees();
      return;
    }
    const tabs = new Set(this.screenTabs().map((tab) => tab.key));
    this.loadMyStatus();
    this.loadMyRequests();
    this.loadMyTimesheets();
    this.loadMyLeaveBalances();
    this.loadRequestTypes();
    if (tabs.has('approvals')) this.loadInbox();
    if (tabs.has('admin-timesheets')) {
      this.loadTimesheets();
      this.loadNeedsReviewCount();
    }
    if (tabs.has('admin-shifts')) this.loadShifts();
    if (tabs.has('admin-leave')) this.loadAdminLeave();
    if (tabs.has('team') || tabs.has('admin-reports')) this.loadReports();
    if (this.canSeeCompanyPunches()) this.loadTodaySummary();
    if (tabs.has('team') || tabs.has('admin-timesheets')) {
      this.loadEmployeeDirectory();
    }
    if (this.isStandaloneKioskMode()) {
      this.loadKioskEmployees();
    }
  }
  acquireGps(): void {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      this.gpsLoading.set(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.gpsLoading.set(false);
          this.gpsLat.set(pos.coords.latitude);
          this.gpsLng.set(pos.coords.longitude);
          this.gpsAccuracy.set(Math.round(pos.coords.accuracy));
          // Distance calculation against default office location (e.g. 21.0285, 105.8542)
          const officeLat = 21.0285;
          const officeLng = 105.8542;
          const dist = this.haversine(pos.coords.latitude, pos.coords.longitude, officeLat, officeLng);
          this.gpsDistance.set(dist);
          this.gpsInside.set(dist <= 300);
        },
        () => {
          this.gpsLoading.set(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Punch actions
  readonly myKioskPinDrawerOpen = signal<boolean>(false);
  readonly myKioskPin = signal<string>('');
  readonly myKioskPinConfirm = signal<string>('');

  openMyKioskPinDrawer(): void {
    this.myKioskPin.set('');
    this.myKioskPinConfirm.set('');
    this.myKioskPinDrawerOpen.set(true);
  }

  saveMyKioskPin(): void {
    const pin = this.myKioskPin().trim();
    if (!/^\d{4,6}$/.test(pin)) {
      this.showToast(this.i18n.instant('attendance.kiosk.pin_invalid'));
      return;
    }
    if (pin !== this.myKioskPinConfirm().trim()) {
      this.showToast(this.i18n.instant('attendance.kiosk.pin_mismatch'));
      return;
    }
    this.loading.set(true);
    this.service.setMyKioskPin(pin).subscribe({
      next: () => {
        this.loading.set(false);
        this.myKioskPinDrawerOpen.set(false);
        this.successMessage.set(this.i18n.instant('attendance.kiosk.pin_saved'));
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: () => {
        this.loading.set(false);
        this.showToast(this.i18n.instant('COMMON_SAVE_ERROR'));
      },
    });
  }

  executePunch(type: PunchType): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.service
      .punch({
        punch_type: type,
        source: this.isMobile() ? 'MOBILE' : 'WEB',
        latitude: this.gpsLat(),
        longitude: this.gpsLng(),
        note: this.punchNote() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.successMessage.set(this.i18n.instant('attendance.checkin.punch_success'));
          this.todayStatus.set(res.data?.today_status || 'PRESENT');
          this.loadMyStatus();
          setTimeout(() => this.successMessage.set(null), 4000);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set(this.i18n.instant('attendance.checkin.punch_error'));
          setTimeout(() => this.errorMessage.set(null), 4000);
        },
      });
  }

  loadMyStatus(): void {
    this.service.myStatus().subscribe({
      next: (res) => {
        if (res.data) {
          this.todayStatus.set(res.data.today_record?.status || 'ABSENT');
          this.lastPunch.set(res.data.last_log || null);
          this.currentShift.set(res.data.shift || null);
          const week = (res.data.week_schedule || []).map((day: any) => ({
            date: day.date,
            day: this.weekdayShort(day.date),
            shift: day.shift || undefined,
            status: day.status || undefined,
          }));
          this.weekSchedule.set(week);
        }
      },
      error: () => {
        this.weekSchedule.set([]);
      },
    });

    this.service.myLogs(1, 100).subscribe({
      next: (res) => {
        this.myLogsList.set(res.data?.items || []);
        this.myLogsTotal.set(this.myLogsList().length);
      },
    });
  }

  private weekdayShort(date: string): string {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    try {
      return new Intl.DateTimeFormat(this.i18n.currentLang() || 'vi', { weekday: 'short' }).format(parsed);
    } catch {
      return '';
    }
  }

  // Requests
  loadMyRequests(): void {
    this.service.myRequests(1, 200).subscribe({
      next: (res) => {
        this.myRequestsList.set(res.data?.items || []);
        this.myRequestsTotal.set(this.myRequestsList().length);
        this.applyPendingSelection();
      },
    });
  }

  viewMyRequest(req: AttendanceRequest): void {
    this.selectedMyRequest.set(req);
    this.myRequestDrawerOpen.set(true);
  }

  // My timesheet periods (self-service)
  loadMyTimesheets(): void {
    this.service.myTimesheets(1, 50).subscribe({
      next: (res) => {
        const periods = res.data?.items || [];
        this.myTimesheetPeriods.set(periods);
        if (periods.length === 0) {
          this.selectedMyPeriod.set(null);
          this.myDailyRecords.set([]);
          return;
        }
        const current = this.selectedMyPeriod();
        const match = current ? periods.find((item) => item.id === current.id) : null;
        this.selectMyPeriod(match || periods[0]);
        this.applyPendingSelection();
      },
      error: () => {
        this.myTimesheetPeriods.set([]);
        this.selectedMyPeriod.set(null);
        this.myDailyRecords.set([]);
      },
    });
  }

  selectMyPeriod(period: MyTimesheet): void {
    this.selectedMyPeriod.set(period);
    const from = this.periodBoundary(period, false);
    const to = this.periodBoundary(period, true);
    this.busy.set(true);
    this.service.myRecords(from, to).subscribe({
      next: (res) => this.myDailyRecords.set(res.data?.items || []),
      error: () => this.myDailyRecords.set([]),
      complete: () => this.busy.set(false),
    });
  }

  onMyPeriodChange(id: string): void {
    const period = this.myTimesheetPeriods().find((item) => item.id === id);
    if (period) {
      this.selectMyPeriod(period);
    }
  }

  private periodBoundary(period: MyTimesheet, end: boolean): string {
    const year = period.period_year;
    const month = period.period_month;
    const day = end ? new Date(year, month, 0).getDate() : 1;
    return String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  // Team report range (independent from the admin period picker)
  applyTeamRange(): void {
    const from = this.teamFrom() ? this.teamFrom() + '-01' : undefined;
    const to = this.teamTo() ? this.monthEnd(this.teamTo()) : undefined;
    this.busy.set(true);
    let pending = 4;
    const done = () => {
      pending -= 1;
      if (pending === 0) this.busy.set(false);
    };
    this.service.reportTeam(from, to).subscribe({
      next: (res) => this.teamMetricsList.set(res.data?.items || []),
      complete: done,
      error: done,
    });
    this.service.reportSummary(from, to).subscribe({
      next: (res) => this.summaryMetrics.set(res.data || null),
      complete: done,
      error: done,
    });
    this.service.reportTopLate(from, to).subscribe({
      next: (res) => this.topLateList.set(res.data?.items || []),
      complete: done,
      error: done,
    });
    this.service.reportOvertime(from, to).subscribe({
      next: (res) => this.overtimeList.set(res.data?.items || []),
      complete: done,
      error: done,
    });
  }

  applyReportRange(): void {
    const from = this.reportFrom() ? `${this.reportFrom()}-01` : undefined;
    const to = this.reportTo() ? this.monthEnd(this.reportTo()) : undefined;
    this.busy.set(true);
    let pending = 4;
    const done = () => {
      pending -= 1;
      if (pending === 0) this.busy.set(false);
    };
    this.service.reportTeam(from, to).subscribe({
      next: (res) => this.teamMetricsList.set(res.data?.items || []),
      complete: done,
      error: done,
    });
    this.service.reportSummary(from, to).subscribe({
      next: (res) => this.summaryMetrics.set(res.data || null),
      complete: done,
      error: done,
    });
    this.service.reportTopLate(from, to).subscribe({
      next: (res) => this.topLateList.set(res.data?.items || []),
      complete: done,
      error: done,
    });
    this.service.reportOvertime(from, to).subscribe({
      next: (res) => this.overtimeList.set(res.data?.items || []),
      complete: done,
      error: done,
    });
  }

  private filterReportRows<T>(rows: T[]): T[] {
    const department = this.reportDepartment();
    const term = this.reportSearch().trim().toLowerCase();
    return rows.filter((row) => {
      const item = row as Record<string, unknown>;
      if (department !== 'ALL' && item['department_name'] !== department) return false;
      if (term) {
        const haystack = `${item['employee_code'] || ''} ${item['full_name'] || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }

  private monthEnd(month: string): string {
    const [year, monthNumber] = month.split('-').map((part) => Number(part));
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return month + '-' + String(lastDay).padStart(2, '0');
  }

  loadRequestTypes(): void {
    this.service.requestTypes().subscribe({
      next: (res) => {
        this.requestTypesList.set(res.data?.items || []);
      },
    });
  }

  openNewRequestDrawer(): void {
    this.newRequestDrawerOpen.set(true);
    this.requestFromDate.set(new Date().toISOString().split('T')[0]);
    this.requestToDate.set(new Date().toISOString().split('T')[0]);
    this.requestReason.set('');
  }

  submitNewRequest(): void {
    if (!this.requestReason()) {
      return;
    }
    const type = this.selectedRequestTypeCode();
    const from = this.requestFromDate();
    const to = this.requestToDate();
    const reason = this.requestReason();
    const data: Record<string, unknown> = {
      from_date: from,
      to_date: to,
      reason,
      hours: this.requestCustomHours(),
    };
    if (type === 'LEAVE' || type === 'BUSINESS_TRIP') {
      data['start_date'] = from;
      data['end_date'] = to || from;
      data['days'] = 1;
    }
    if (type === 'OVERTIME') {
      data['work_date'] = from;
      data['start_at'] = `${from}T18:00:00`;
      data['end_at'] = `${from}T20:00:00`;
    }
    if (type === 'ATTENDANCE_FIX') {
      data['work_date'] = from;
      data['event_type'] = 'IN';
      data['occurred_at'] = `${from}T08:00:00`;
    }
    if (type === 'LATE_EARLY') {
      data['work_date'] = from;
    }
    if (type === 'SHIFT_SWAP') {
      data['work_date'] = from;
      data['shift_definition_id'] = this.shiftsList()[0]?.id ?? null;
    }
    this.loading.set(true);
    this.service
      .submitRequest({
        request_type_code: type,
        data,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.newRequestDrawerOpen.set(false);
          this.loadMyRequests();
          this.successMessage.set(this.i18n.instant('attendance.request.submitted_success'));
          setTimeout(() => this.successMessage.set(null), 4000);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set(this.i18n.instant('attendance.request.submit_error'));
          setTimeout(() => this.errorMessage.set(null), 4000);
        },
      });
  }

  // Inbox & Approvals
  loadInbox(): void {
    this.service.requestInbox(1, 200).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.inboxRequestsList.set(items);
        const currentList = this.filteredInboxRequests();
        if (currentList.length > 0 && !this.selectedInboxRequest()) {
          this.selectInboxRequest(currentList[0]);
        }
        this.applyPendingSelection();
      },
      error: () => {
        this.inboxRequestsList.set([]);
      },
    });
  }

  selectInboxRequest(req: AttendanceRequest): void {
    this.selectedInboxRequest.set(req);
    this.approvalComment.set('');

    const payload = (req.response || req.data || {}) as Record<string, any>;
    const fromDate = payload['from_date'] ?? payload['work_date'] ?? payload['start_date'] ?? null;
    const toDate = payload['to_date'] ?? payload['end_date'] ?? fromDate;
    const approved = req.status === 'APPROVED';
    const rejected = req.status === 'REJECTED';
    const approvalStatus: ApprovalStepInfo['status'] = approved ? 'COMPLETED' : rejected ? 'REJECTED' : 'PENDING';
    const mappingApplied = req.mapping_status === 'APPLIED';

    this.selectedRequestWorkflow.set({
      workflow_key: req.request_type_code,
      workflow_name: req.request_type_name || req.request_type_code,
      instance_id: req.workflow_instance_id || req.id,
      engine: req.approval_mode === 'ENGINE' ? 'WORKFLOW_ENGINE' : 'INTERNAL_FALLBACK',
      current_step: approved || rejected ? 2 : 1,
      total_steps: 2,
      sla_hours: 24,
      steps: [
        {
          step_number: 1,
          step_name: this.i18n.instant('attendance.workflow.step_employee_title'),
          actor_name: req.employee_name || req.employee_id || '',
          actor_role: this.i18n.instant('attendance.workflow.step_employee_title'),
          status: 'COMPLETED',
          action_time: req.submitted_at,
          comment: payload['reason'] || null,
        },
        {
          step_number: 2,
          step_name: this.i18n.instant('attendance.workflow.step_manager_title'),
          actor_name: '',
          actor_role: this.i18n.instant('attendance.workflow.step_manager_title'),
          status: approvalStatus,
          action_time: req.approved_at,
          comment: req.comment || null,
        },
      ],
      form_payload: {
        from_date: fromDate,
        to_date: toDate,
        duration_days: typeof payload['days'] === 'number' ? payload['days'] : undefined,
        overtime_hours: typeof payload['hours'] === 'number' ? payload['hours'] : undefined,
        reason: payload['reason'],
      },
      post_actions: [
        {
          type: 'REQUEST_MAPPING',
          description: req.mapping_error || this.i18n.instant('attendance.workflow.auto_record_desc'),
          status: mappingApplied ? 'APPLIED' : 'PENDING',
        },
      ],
    });

    this.inboxTimelineNodes.set([
      {
        title: this.i18n.instant('attendance.request.submitted'),
        status: 'SUBMITTED',
        actorName: req.employee_name || '',
        timestamp: req.submitted_at,
        isDone: true,
      },
      {
        title: this.i18n.instant('attendance.workflow.step_manager_title'),
        status: req.status,
        actorName: '',
        timestamp: req.approved_at,
        comment: req.comment || undefined,
        isDone: approved,
        isFailed: rejected,
      },
    ]);
  }


  processApproval(action: 'APPROVE' | 'REJECT'): void {
    const current = this.selectedInboxRequest();
    if (!current) {
      return;
    }
    if (action === 'REJECT' && !this.approvalComment()) {
      this.errorMessage.set(this.i18n.instant('attendance.request.comment_required_reject'));
      return;
    }

    this.loading.set(true);
    this.service.fallbackAction(current.id, action, this.approvalComment()).subscribe({
      next: () => {
        this.loading.set(false);
        this.loadInbox();
        this.selectedInboxRequest.set(null);
        this.successMessage.set(this.i18n.instant('attendance.request.action_success'));
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not process approval');
      },
    });
  }

  // Leave Balances
  loadMyLeaveBalances(): void {
    this.service.myLeaveBalances().subscribe({
      next: (res) => {
        this.myLeaveBalances.set(res.data?.items || []);
      },
    });
  }

  loadAdminLeave(): void {
    this.service.leaveTypes().subscribe({
      next: (res) => {
        this.leaveTypesList.set(res.data?.items || []);
        if (!this.grantLeaveTypeId() && this.leaveTypesList().length > 0) {
          this.grantLeaveTypeId.set(this.leaveTypesList()[0].id);
        }
      },
    });
    this.service.employees().subscribe({
      next: (res) => {
        this.employeesList.set(res.data?.items || []);
        if (!this.grantEmployeeId() && this.employeesList().length > 0) {
          this.grantEmployeeId.set(this.employeesList()[0].employee_id);
        }
      },
    });
    this.service.adminLeaveBalances(this.leaveBalancesPage() + 1, 100).subscribe({
      next: (res) => {
        this.adminLeaveBalancesList.set(res.data?.items || []);
        this.leaveBalancesTotal.set(res.data?.total_items || this.adminLeaveBalancesList().length);
      },
    });
    this.service.leaveLedger(undefined, this.leaveLedgerPage() + 1, 100).subscribe({
      next: (res) => {
        this.leaveLedgerList.set(res.data?.items || []);
        this.leaveLedgerTotal.set(res.data?.total_items || this.leaveLedgerList().length);
      },
    });
  }

  confirmCreateLeaveType(): void {
    if (!this.newLeaveTypeCode() || !this.newLeaveTypeName()) {
      return;
    }
    this.loading.set(true);
    this.service
      .createLeaveType({
        code: this.newLeaveTypeCode().trim().toUpperCase(),
        name: this.newLeaveTypeName().trim(),
        paid: true,
        counts_as_work: true,
        deduct_balance: true,
        default_annual_grant: this.newLeaveTypeDays(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.newLeaveTypeDrawerOpen.set(false);
          this.newLeaveTypeCode.set('');
          this.newLeaveTypeName.set('');
          this.loadAdminLeave();
        },
        error: () => {
          this.loading.set(false);
          this.showToast(this.i18n.instant('COMMON_SAVE_ERROR'));
        },
      });
  }

  confirmGrantLeave(): void {
    const employeeId = this.grantEmployeeId();
    const leaveTypeId = this.grantLeaveTypeId();
    if (!employeeId || !leaveTypeId) {
      return;
    }
    this.loading.set(true);
    this.service
      .grantLeave({
        employee_ids: [employeeId],
        leave_type_id: leaveTypeId,
        days: this.grantDays(),
        note: this.grantNote() || null,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.grantLeaveDrawerOpen.set(false);
          this.grantNote.set('');
          this.loadAdminLeave();
        },
        error: () => {
          this.loading.set(false);
          this.showToast(this.i18n.instant('COMMON_SAVE_ERROR'));
        },
      });
  }

  loadAdminLogs(): void {
    const source = this.logSourceFilter() === 'ALL' ? undefined : this.logSourceFilter();
    const from = this.logFrom() || undefined;
    const to = this.logTo() || undefined;
    const seq = ++this.logsSeq;
    this.logsLoading.set(true);
    const collected: AttendanceLog[] = [];
    const fetchPage = (page: number) => {
      this.service.adminLogs(page, 200, source, from, to).subscribe({
        next: (res) => {
          if (seq !== this.logsSeq) return;
          collected.push(...(res.data?.items || []));
          const total = res.data?.total_items || collected.length;
          const lastPage = Math.max(1, Math.ceil(total / 200));
          if (page < lastPage && page < 100) {
            fetchPage(page + 1);
          } else {
            this.adminLogsList.set(collected);
            this.adminLogsTotal.set(total);
            const maxPage = Math.max(0, Math.ceil(collected.length / this.adminLogsSize()) - 1);
            if (this.adminLogsPage() > maxPage) this.adminLogsPage.set(maxPage);
            this.logsLoading.set(false);
          }
        },
        error: () => {
          if (seq !== this.logsSeq) return;
          this.adminLogsList.set(collected);
          this.adminLogsTotal.set(collected.length);
          this.logsLoading.set(false);
        },
      });
    };
    fetchPage(1);
  }

  openLogDetail(log: AttendanceLog): void {
    this.selectedLogDetail.set(log);
    this.logDetailDrawerOpen.set(true);
  }

  openRecordDetail(record: AttendanceRecord): void {
    this.selectedRecordDetail.set(record);
    this.recordDetailDrawerOpen.set(true);
  }

  openShiftDetail(shift: ShiftDefinition): void {
    this.selectedShiftDetail.set(shift);
    this.shiftDetailDrawerOpen.set(true);
  }

  openLeaveDetail(row: unknown): void {
    this.selectedLeaveDetail.set(row as Record<string, unknown>);
    this.leaveDetailDrawerOpen.set(true);
  }

  detailEntries(row: unknown): Array<{ key: string; value: string }> {
    const source = row as Record<string, unknown>;
    const labels: Record<string, string> = {
      employee_name: this.i18n.instant('attendance.table.emp_name'),
      leave_type_name: this.i18n.instant('attendance.request.type'),
      granted: this.i18n.instant('attendance.leave.granted'),
      used: this.i18n.instant('attendance.leave.used'),
      remaining: this.i18n.instant('attendance.leave.remaining'),
      expiring: this.i18n.instant('attendance.leave.expiring'),
      valid_until: this.i18n.instant('attendance.leave.valid_until'),
      entry_type: this.i18n.instant('attendance.table.type'),
      days: this.i18n.instant('attendance.leave.change_days'),
      note: this.i18n.instant('attendance.table.note'),
      created_at: this.i18n.instant('attendance.table.time'),
      department_name: this.i18n.instant('attendance.table.department'),
    };
    const hidden = new Set(['id', 'employee_id', 'leave_type_id', 'source_request_id', 'created_by', 'updated_at']);
    return Object.entries(source)
      .filter(([key, value]) => !hidden.has(key) && value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        key: labels[key] || key.replaceAll('_', ' '),
        value: key === 'entry_type'
          ? this.i18n.instant('attendance.leave.entry.' + value)
          : key === 'valid_until' || key === 'created_at'
            ? this.formatDateTime(value as string)
            : String(value),
      }));
  }

  editSelectedShift(): void {
    const shift = this.selectedShiftDetail();
    if (!shift) return;
    this.editingShift.set({ ...shift });
    this.shiftDetailDrawerOpen.set(false);
    this.shiftDrawerOpen.set(true);
  }

  openEmployeeRecords(
    employee: Partial<EmployeeDirectory> & { employee_id: string },
    from?: string,
    to?: string
  ): void {
    const known = this.employeeDirectoryList().find((item) => item.employee_id === employee.employee_id);
    const target: EmployeeDirectory = {
      employee_id: employee.employee_id,
      employee_code: employee.employee_code || known?.employee_code || '',
      full_name: employee.full_name || known?.full_name || '',
      department_name: employee.department_name || known?.department_name || null,
      branch_name: employee.branch_name || known?.branch_name || null,
      employment_status: employee.employment_status || known?.employment_status || null,
    };
    const period = this.selectedTimesheet();
    const rangeFrom = from || period?.period_start || `${this.teamFrom() || this.reportFrom()}-01`;
    const rangeTo = to || period?.period_end || this.monthEnd(this.teamTo() || this.reportTo());
    this.employeeRecordTarget.set(target);
    this.employeeRecordFrom.set(rangeFrom);
    this.employeeRecordTo.set(rangeTo);
    if (this.employeeDirectoryList().length === 0) {
      this.loadEmployeeDirectory();
    }
    this.employeeRecordDrawerOpen.set(true);
    this.loadEmployeeRecords();
  }

  openTimesheetEmployee(row: any): void {
    const target: EmployeeDirectory = {
      employee_id: row.employee_id,
      employee_code: row.employee_code,
      full_name: row.employee_name,
      department_name: row.department,
      branch_name: null,
      employment_status: 'ACTIVE',
    };
    this.openEmployeeRecords(target, this.selectedTimesheet()?.period_start, this.selectedTimesheet()?.period_end);
  }

  loadEmployeeRecords(): void {
    const target = this.employeeRecordTarget();
    if (!target) return;
    this.employeeRecordsLoading.set(true);
    this.service.employeeRecords(target.employee_id, this.employeeRecordFrom(), this.employeeRecordTo()).subscribe({
      next: (res) => {
        this.employeeRecordList.set(res.data?.items || []);
        this.employeeRecordsLoading.set(false);
      },
      error: () => {
        this.employeeRecordList.set([]);
        this.employeeRecordsLoading.set(false);
      },
    });
  }

  readonly employeeRecordSummary = computed(() => {
    const records = this.employeeRecordList();
    let actual = 0;
    let paidLeave = 0;
    let otMinutes = 0;
    let lateMinutes = 0;
    for (const record of records) {
      if (record.status === 'PRESENT' || record.status === 'WFH' || record.status === 'BUSINESS_TRIP') actual += 1;
      else if (record.status === 'HALF_DAY') actual += 0.5;
      else if (record.status === 'ON_LEAVE') paidLeave += 1;
      otMinutes += record.ot_hours * 60;
      lateMinutes += record.late_minutes || 0;
    }
    return { actual_days: actual, paid_leave_days: paidLeave, ot_hours: Math.round((otMinutes / 60) * 10) / 10, late_minutes: lateMinutes };
  });

  toggleBulkEmployee(employeeId: string, checked: boolean): void {
    const next = new Set(this.bulkAssignSelected());
    if (checked) next.add(employeeId);
    else next.delete(employeeId);
    this.bulkAssignSelected.set(next);
  }

  toggleBulkEmployees(checked: boolean): void {
    this.bulkAssignSelected.set(checked ? new Set(this.bulkEmployees().map((e) => e.employee_id)) : new Set());
  }

  recalculateRecordsForDate(): void {
    const date = this.recordDate();
    this.loading.set(true);
    this.service.recalculate(date, date).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.loadAdminRecords();
        this.loadNeedsReviewCount();
        this.showToast(
          this.i18n.instant('attendance.records.recalc_done', { count: res.data?.calculated ?? 0 })
        );
      },
      error: () => {
        this.loading.set(false);
        this.showToast(this.i18n.instant('COMMON_SAVE_ERROR'));
      },
    });
  }

  loadAdminRecords(): void {
    this.recordsLoading.set(true);
    this.service.adminRecords(this.adminRecordsPage() + 1, this.adminRecordsSize(), this.recordDate()).subscribe({
      next: (res) => {
        this.adminRecordsList.set(res.data?.items || []);
        this.adminRecordsTotal.set(res.data?.total_items || this.adminRecordsList().length);
        this.recordsLoading.set(false);
      },
      error: () => this.recordsLoading.set(false),
    });
  }

  // Shifts
  loadShifts(): void {
    this.service.shifts().subscribe({
      next: (res) => {
        this.shiftsList.set(res.data?.items || []);
        const maxPage = Math.max(0, Math.ceil(this.shiftsList().length / this.shiftsSize()) - 1);
        if (this.shiftsPage() > maxPage) this.shiftsPage.set(maxPage);
        if (!this.bulkAssignShiftId() && this.shiftsList().length > 0) {
          this.bulkAssignShiftId.set(this.shiftsList()[0].id);
        }
      },
    });
    this.loadShiftCoverage();
  }

  loadShiftCoverage(): void {
    this.service.shiftCoverage(this.coverageMonth()).subscribe({
      next: (res) => this.shiftCoverageList.set(res.data?.items || []),
      error: () => this.shiftCoverageList.set([]),
    });
  }

  loadEmployeeDirectory(): void {
    this.service.employees().subscribe({
      next: (res) => {
        const directory = res.data?.items || [];
        this.employeeDirectoryList.set(directory);
        this.employeesList.set(
          directory.map((employee) => ({
            employee_id: employee.employee_id,
            employee_code: employee.employee_code,
            full_name: employee.full_name,
          }))
        );
        const target = this.employeeRecordTarget();
        if (target) {
          const match = directory.find((employee) => employee.employee_id === target.employee_id);
          if (match) {
            this.employeeRecordTarget.set({
              ...target,
              department_name: target.department_name || match.department_name || null,
              branch_name: target.branch_name || match.branch_name || null,
            });
          }
        }
        if (this.kioskDrawerOpen() && !this.kioskNewBranchId()) {
          const branch = directory.find((employee) => employee.branch_id);
          if (branch?.branch_id) {
            this.kioskNewBranchId.set(branch.branch_id);
          }
        }
      },
      error: () => this.employeeDirectoryList.set([]),
    });
  }

  openBulkAssignDrawer(): void {
    if (!this.bulkAssignShiftId() && this.shiftsList().length > 0) {
      this.bulkAssignShiftId.set(this.shiftsList()[0].id);
    }
    if (this.employeeDirectoryList().length === 0) {
      this.loadEmployeeDirectory();
    }
    this.bulkAssignSelected.set(new Set());
    this.bulkAssignBranch.set('ALL');
    this.bulkAssignDepartment.set('ALL');
    this.bulkAssignSearch.set('');
    this.bulkAssignDrawerOpen.set(true);
  }

  confirmBulkAssign(): void {
    const shiftId = this.bulkAssignShiftId();
    const month = this.bulkAssignMonth();
    const employeeIds = Array.from(this.bulkAssignSelected());
    if (!shiftId || !month) {
      return;
    }
    if (employeeIds.length === 0) {
      this.showToast(this.i18n.instant('attendance.shifts.bulk_select_required'));
      return;
    }
    const [year, monthNumber] = month.split('-').map((part) => Number(part));
    const lastDay = new Date(year, monthNumber, 0).getDate();
    // Chunks keep each gateway call under the 30s plugin timeout.
    const chunks: Array<{ from: string; to: string }> = [];
    for (let day = 1; day <= lastDay; day += 7) {
      const from = new Date(year, monthNumber - 1, day);
      const to = new Date(year, monthNumber - 1, Math.min(day + 6, lastDay));
      chunks.push({ from: this.toIsoDate(from), to: this.toIsoDate(to) });
    }

    this.loading.set(true);
    let assigned = 0;
    let skipped = 0;
    const runNext = (index: number) => {
      if (index >= chunks.length) {
        this.loading.set(false);
        this.bulkAssignDrawerOpen.set(false);
        this.showToast(
          this.i18n.instant('attendance.shifts.bulk_assign_result', { assigned, skipped })
        );
        this.loadShiftCoverage();
        return;
      }
      this.service
        .bulkAssignShifts({
          shift_definition_id: shiftId,
          from: chunks[index].from,
          to: chunks[index].to,
          employee_ids: employeeIds,
        })
        .subscribe({
          next: (res) => {
            assigned += res.data?.assigned || 0;
            skipped += res.data?.skipped || 0;
            runNext(index + 1);
          },
          error: () => {
            this.loading.set(false);
            this.showToast(this.i18n.instant('COMMON_SAVE_ERROR'));
          },
        });
    };
    runNext(0);
  }

  private toIsoDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  loadAuditLogs(): void {
    this.service
      .auditLogs(this.auditPage() + 1, this.auditSize(), this.auditActionFilter(), this.auditEntityFilter())
      .subscribe({
        next: (res) => {
          this.auditLogsList.set(res.data?.items || []);
          this.auditTotal.set(res.data?.total_items || this.auditLogsList().length);
        },
        error: () => {
          this.auditLogsList.set([]);
          this.auditTotal.set(0);
        },
      });
  }

  openNewTimesheetDrawer(): void {
    this.newTimesheetYear.set(new Date().getFullYear());
    this.newTimesheetMonth.set(new Date().getMonth() + 1);
    this.newTimesheetDrawerOpen.set(true);
  }

  confirmCreateTimesheet(): void {
    this.loading.set(true);
    this.service
      .createTimesheet({
        period_year: this.newTimesheetYear(),
        period_month: this.newTimesheetMonth(),
        scope_type: 'TENANT',
        wage_calc_mode: 'STANDARD_MINUS_UNPAID',
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.newTimesheetDrawerOpen.set(false);
          this.loadTimesheets();
        },
        error: () => {
          this.loading.set(false);
          this.showToast(this.i18n.instant('COMMON_SAVE_ERROR'));
        },
      });
  }

  openNewShiftDrawer(): void {
    this.editingShift.set({
      code: '',
      name: '',
      start_time: '08:00',
      end_time: '17:00',
      grace_in_minutes: 15,
      grace_out_minutes: 15,
      work_hours: 8,
      is_active: true,
    });
    this.shiftDrawerOpen.set(true);
  }

  saveShift(): void {
    const shift = this.editingShift();
    if (!shift.code || !shift.name) {
      return;
    }
    this.service.saveShift(shift).subscribe({
      next: () => {
        this.shiftDrawerOpen.set(false);
        this.loadShifts();
      },
    });
  }

  // Timesheets
  loadTimesheets(): void {
    this.service.timesheets(this.timesheetsPage() + 1, this.timesheetsSize()).subscribe({
      next: (res) => {
        this.timesheetsList.set(res.data?.items || []);
        this.timesheetsTotal.set(res.data?.total_items || this.timesheetsList().length);
        if (res.data?.items && res.data.items.length > 0 && !this.selectedTimesheet()) {
          this.selectTimesheet(res.data.items[0], false);
        }
        this.applyPendingSelection();
      },
    });
  }

  selectTimesheet(ts: Timesheet, openDetail = true): void {
    this.selectedTimesheet.set(ts);
    this.timesheetSummaryPage.set(0);
    if (ts.period_start) this.reportFrom.set(ts.period_start.slice(0, 7));
    if (ts.period_end) this.reportTo.set(ts.period_end.slice(0, 7));
    if (ts.period_start) {
      this.coverageMonth.set(ts.period_start.slice(0, 7));
      this.loadShiftCoverage();
    }
    if (openDetail) {
      this.timesheetView.set('detail');
    }
    this.loadTimesheetConfirmations(ts.id);
    this.loadReports();
  }

  changeTimesheetStep(step: string): void {
    const current = this.selectedTimesheet();
    if (!current || current.locked) {
      return;
    }
    if (step === 'S3_CALCULATE' && current.step !== 'S3_CALCULATE') {
      this.runBatchCalculation(() => this.applyTimesheetStep(step));
      return;
    }
    this.applyTimesheetStep(step);
  }

  private applyTimesheetStep(step: string): void {
    const current = this.selectedTimesheet();
    if (!current) {
      return;
    }
    this.service.changeTimesheetStep(current.id, step).subscribe({
      next: (res) => {
        this.selectedTimesheet.set(res.data || null);
        this.loadTimesheets();
      },
    });
  }

  toggleLockTimesheet(): void {
    const current = this.selectedTimesheet();
    if (!current) {
      return;
    }
    if (current.locked) {
      this.service.unlockTimesheet(current.id, 'Audit unlock').subscribe({
        next: (res) => {
          this.selectedTimesheet.set(res.data || null);
          this.loadTimesheets();
        },
      });
    } else {
      this.lockDrawerOpen.set(true);
    }
  }

  confirmLockTimesheet(): void {
    const current = this.selectedTimesheet();
    if (!current) {
      return;
    }
    this.service.lockTimesheet(current.id, this.lockReason() || 'Period finalized').subscribe({
      next: (res) => {
        this.lockDrawerOpen.set(false);
        this.selectedTimesheet.set(res.data || null);
        this.loadTimesheets();
      },
    });
  }

  sendTimesheetConfirmations(): void {
    const current = this.selectedTimesheet();
    if (!current) {
      return;
    }
    this.service.sendConfirmations(current.id).subscribe({
      next: () => {
        this.successMessage.set(this.i18n.instant('attendance.timesheet.send_confirmations'));
        setTimeout(() => this.successMessage.set(null), 3000);
      },
    });
  }

  confirmMyTimesheet(): void {
    const current = this.selectedMyPeriod();
    if (!current) {
      return;
    }
    this.service.confirmMyTimesheet(current.id).subscribe({
      next: () => {
        this.successMessage.set(this.i18n.instant('attendance.timesheet.confirmed'));
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadMyTimesheets();
      },
    });
  }

  rejectMyTimesheet(): void {
    const current = this.selectedMyPeriod();
    if (!current) {
      return;
    }
    this.service.rejectMyTimesheet(current.id, 'Disputed by employee').subscribe({
      next: () => {
        this.successMessage.set(this.i18n.instant('attendance.timesheet.rejected'));
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadMyTimesheets();
      },
    });
  }

  loadTodaySummary(): void {
    this.service.reportSummary(this.today, this.today).subscribe({
      next: (res) => this.todaySummary.set(res.data || null),
      error: () => this.todaySummary.set(null),
    });
  }

  // Reports
  private lastReportPeriod = '';
  private reportSeq = 0;
  readonly reportPeriodLabel = computed(() => {
    const ts = this.selectedTimesheet();
    return ts ? ts.name : this.i18n.instant('attendance.report.current_month');
  });

  loadReports(): void {
    const ts = this.selectedTimesheet();
    const from = ts?.period_start || undefined;
    const to = ts?.period_end || undefined;
    const key = `${from}|${to}`;
    if (key === this.lastReportPeriod) {
      return;
    }
    this.lastReportPeriod = key;
    const seq = ++this.reportSeq;
    const current = () => seq === this.reportSeq;
    this.service.reportSummary(from, to).subscribe({
      next: (res) => current() && this.summaryMetrics.set(res.data || null),
    });
    this.service.reportTeam(from, to).subscribe({
      next: (res) => current() && this.teamMetricsList.set(res.data?.items || []),
    });
    this.service.reportTopLate(from, to).subscribe({
      next: (res) => current() && this.topLateList.set(res.data?.items || []),
    });
    this.service.reportOvertime(from, to).subscribe({
      next: (res) => current() && this.overtimeList.set(res.data?.items || []),
    });
  }

  exportTimesheetCsv(): void {
    const current = this.selectedTimesheet();
    if (!current) {
      return;
    }
    this.service.exportTimesheetCsv(current.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timesheet_${current.name}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  // Timesheet Period Closing Pipeline Actions


  runBatchCalculation(after?: () => void): void {
    const ts = this.selectedTimesheet();
    if (!ts) {
      return;
    }
    const start = new Date(ts.period_start);
    const end = new Date(ts.period_end);
    const chunks: Array<{ from: string; to: string }> = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const chunkStart = new Date(cursor);
      const chunkEnd = new Date(cursor);
      chunkEnd.setDate(chunkEnd.getDate() + 6);
      if (chunkEnd > end) {
        chunkEnd.setTime(end.getTime());
      }
      chunks.push({ from: this.toIsoDate(chunkStart), to: this.toIsoDate(chunkEnd) });
      cursor.setDate(cursor.getDate() + 7);
    }

    this.loading.set(true);
    let calculated = 0;
    const runNext = (index: number) => {
      if (index >= chunks.length) {
        this.loading.set(false);
        this.successMessage.set(
          this.i18n.instant('attendance.timesheet.batch_engine_success', { count: calculated })
        );
        setTimeout(() => this.successMessage.set(null), 3500);
        this.loadAdminRecords();
        this.loadNeedsReviewCount();
        this.service.getTimesheet(ts.id).subscribe({
          next: (res) => this.selectedTimesheet.set(res.data || null),
        });
        if (after) {
          after();
        }
        return;
      }
      this.service.recalculate(chunks[index].from, chunks[index].to).subscribe({
        next: (res) => {
          calculated += res.data?.calculated || 0;
          runNext(index + 1);
        },
        error: () => {
          this.loading.set(false);
          this.showToast(this.i18n.instant('COMMON_SAVE_ERROR'));
        },
      });
    };
    runNext(0);
  }


  loadNeedsReviewCount(): void {
    this.service.needsReviewCount().subscribe({
      next: (res) => this.needsReviewTotal.set(res.data?.total_items || 0),
      error: () => this.needsReviewTotal.set(0),
    });
  }

  sendPeriodConfirmations(): void {
    const current = this.selectedTimesheet();
    if (!current) {
      return;
    }
    this.service.sendConfirmations(current.id).subscribe({
      next: () => {
        this.loadTimesheetConfirmations(current.id);
        this.showToast(this.i18n.instant('attendance.timesheet.confirmations_sent_toast'));
      },
      error: () => this.showToast(this.i18n.instant('COMMON_SAVE_ERROR')),
    });
  }

  private loadTimesheetConfirmations(id: string): void {
    this.service.timesheetConfirmations(id).subscribe({
      next: (res) => this.timesheetConfirmationsList.set(res.data?.items || []),
      error: () => this.timesheetConfirmationsList.set([]),
    });
  }

  lockPeriodPipeline(): void {
    const cur = this.selectedTimesheet();
    if (!cur || cur.locked) {
      return;
    }
    this.lockDrawerOpen.set(true);
  }

  // Kiosk Mode Actions
  kioskKeypadPress(val: string): void {
    if (this.kioskPin().length < 6) {
      this.kioskPin.update((curr) => curr + val);
    }
  }

  kioskClear(): void {
    this.kioskPin.set('');
    this.kioskEmployeeCode.set('');
    this.kioskSuccessMessage.set(null);
    this.kioskErrorMessage.set(null);
  }

  kioskPunch(type: PunchType): void {
    if (this.kioskAccessDenied()) {
      this.kioskErrorMessage.set(this.i18n.instant('attendance.kiosk.access_denied_hint'));
      return;
    }
    if (!this.kioskEmployeeCode() || !this.kioskPin()) {
      this.kioskErrorMessage.set(this.i18n.instant('attendance.kiosk.punch_failed'));
      return;
    }
    if (this.kioskSessionToken()) {
      this.performKioskPunch(type);
      return;
    }
    this.service
      .kioskAuthenticate(this.kioskDeviceCode(), this.kioskPublicToken(), this.kioskEmployeeCode(), this.kioskPin())
      .subscribe({
        next: (res) => {
          const sessionToken = res.data?.session_token;
          if (!sessionToken) {
            this.kioskErrorMessage.set(this.i18n.instant('attendance.kiosk.punch_failed'));
            return;
          }
          this.kioskSessionToken.set(sessionToken);
          this.performKioskPunch(type);
        },
        error: () => {
          this.kioskErrorMessage.set(this.i18n.instant('attendance.kiosk.punch_failed'));
        },
      });
  }

  private performKioskPunch(type: PunchType): void {
    const nowTime = this.currentTimeString();
    this.service
      .kioskPunch(
        this.kioskDeviceCode(),
        this.kioskPublicToken(),
        this.kioskSessionToken(),
        this.kioskEmployeeCode(),
        type,
      )
      .subscribe({
        next: () => {
          this.kioskSessionToken.set('');
          this.kioskSuccessMessage.set(this.i18n.instant('attendance.kiosk.punch_success'));
          this.kioskErrorMessage.set(null);
          this.kioskEmployeesList.update((list) =>
            list.map((e) =>
              e.code === this.kioskEmployeeCode()
                ? { ...e, punched_today: true, last_punch_time: nowTime, last_punch_type: type }
                : e
            )
          );
          setTimeout(() => {
            this.kioskClear();
            this.backToKioskEmployeeGrid();
          }, 3500);
        },
        error: () => {
          this.kioskSessionToken.set('');
          this.kioskErrorMessage.set(this.i18n.instant('attendance.kiosk.punch_failed'));
        },
      });
  }
}

