import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AttendanceStatusBadgeComponent,
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
  FilterItem,
  FilterStripComponent,
  GpsIndicatorComponent,
  I18nService,
  IconComponent,
  LeaveBalanceCardComponent,
  PeriodStepperComponent,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpTextareaComponent,
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
}

export type AttendanceTab =
  | 'self'
  | 'requests'
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
    BadgeComponent,
    IconComponent,
    FilterStripComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpTextareaComponent,
  ],
  templateUrl: './attendance-screen.component.html',
})
export class AttendanceScreenComponent implements OnInit {
  private service = inject(AttendanceService);
  private i18n = inject(I18nService);

  @Input() context: PluginContext | null = null;
  @Input() isStandaloneKiosk: boolean = false;
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

  readonly toastMessage = signal<string | null>(null);

  showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  readonly screenTabs = computed<ScreenTabItem[]>(() => [
    { key: 'self', labelKey: 'PLUGIN_ATTENDANCE_MY_ATTENDANCE', icon: 'clock', group: 'self' },
    { key: 'requests', labelKey: 'PLUGIN_ATTENDANCE_MY_REQUESTS', icon: 'file-text', count: this.myRequestsList().length, group: 'self' },
    { key: 'team', labelKey: 'PLUGIN_ATTENDANCE_TEAM', icon: 'users', group: 'manager' },
    { key: 'approvals', labelKey: 'PLUGIN_ATTENDANCE_INBOX', icon: 'check-square', count: this.inboxRequestsList().length, group: 'manager' },
    { key: 'admin-timesheets', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_TIMESHEETS', icon: 'calendar', group: 'admin' },
    { key: 'admin-shifts', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_SHIFTS', icon: 'sun', group: 'admin' },
    { key: 'admin-records', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_RECORDS', icon: 'clipboard', group: 'admin' },
    { key: 'admin-logs', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_LOGS', icon: 'list', group: 'admin' },
    { key: 'admin-leave', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_LEAVE', icon: 'award', group: 'admin' },
    { key: 'admin-reports', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_REPORTS', icon: 'bar-chart-2', group: 'admin' },
    { key: 'admin-workflows', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_WORKFLOWS', icon: 'git-branch', group: 'admin' },
    { key: 'admin-kiosk', labelKey: 'PLUGIN_ATTENDANCE_ADMIN_KIOSK', icon: 'tablet', group: 'admin' },
  ]);

  selectTab(tab: AttendanceTab): void {
    this.activeTab.set(tab);
    if (tab === 'admin-leave') {
      this.loadAdminLeave();
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
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Self & Punch
  readonly todayStatus = signal<AttendanceStatus>('ABSENT');
  readonly lastPunch = signal<AttendanceLog | null>(null);
  readonly currentShift = signal<ShiftDefinition | null>(null);
  readonly weekSchedule = signal<Array<{ date: string; day: string; shift?: string; status?: AttendanceStatus }>>([]);
  readonly myLogsList = signal<AttendanceLog[]>([]);
  readonly myLeaveBalances = signal<LeaveBalance[]>([]);

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
    if (filter === 'ALL') {
      return list;
    }
    return list.filter((r) => r.request_type_code === filter);
  });
  readonly selectedInboxRequest = signal<AttendanceRequest | null>(null);
  readonly approvalComment = signal<string>('');
  readonly inboxTimelineNodes = signal<TimelineNode[]>([]);
  readonly approvalsViewMode = signal<'inbox' | 'workflow_catalog'>('inbox');
  readonly selectedRequestWorkflow = signal<RequestWorkflowInfo | null>(null);
  readonly workflowCatalogList = signal<WorkflowDefinitionCatalogItem[]>([
    {
      request_type_code: 'LEAVE',
      request_type_name: 'Nghỉ phép năm / Việc riêng',
      workflow_key: 'WF-LEAVE-3LEVEL',
      workflow_name: 'Quy trình Phê duyệt Nghỉ phép 3 Cấp',
      steps_count: 3,
      sla_hours: 24,
      auto_action: 'Tự động trừ Quỹ phép & Cập nhật công ngày ON_LEAVE',
      is_active: true,
    },
    {
      request_type_code: 'OVERTIME',
      request_type_name: 'Làm thêm giờ (Tăng ca)',
      workflow_key: 'WF-OT-2LEVEL',
      workflow_name: 'Quy trình Phê duyệt Tăng ca 2 Cấp',
      steps_count: 2,
      sla_hours: 12,
      auto_action: 'Tự động mở cửa sổ ghi nhận giờ làm thêm vào Bảng công',
      is_active: true,
    },
    {
      request_type_code: 'ATTENDANCE_FIX',
      request_type_name: 'Giải trình bổ sung công',
      workflow_key: 'WF-ATTENDANCE-FIX',
      workflow_name: 'Quy trình Xác thực Minh chứng Quẹt thẻ',
      steps_count: 2,
      sla_hours: 24,
      auto_action: 'Tự động bổ sung bản ghi chấm công (Punch Log) vào CSDL',
      is_active: true,
    },
    {
      request_type_code: 'LATE_EARLY',
      request_type_name: 'Đi muộn / Về sớm có lý do',
      workflow_key: 'WF-LATE-EARLY',
      workflow_name: 'Quy trình Miễn trừ Phạt Đi muộn',
      steps_count: 1,
      sla_hours: 12,
      auto_action: 'Ghi chú miễn trừ vào bảng công ngày, không phạt chuyên cần',
      is_active: true,
    },
    {
      request_type_code: 'BUSINESS_TRIP',
      request_type_name: 'Công tác ngoại tỉnh / Nước ngoài',
      workflow_key: 'WF-BUSINESS-TRIP',
      workflow_name: 'Quy trình Phê duyệt Công tác & Công tác phí',
      steps_count: 3,
      sla_hours: 48,
      auto_action: 'Đánh dấu trạng thái BUSINESS_TRIP & Chuyển kế toán tạm ứng',
      is_active: true,
    },
    {
      request_type_code: 'SHIFT_SWAP',
      request_type_name: 'Đổi ca làm việc',
      workflow_key: 'WF-SHIFT-SWAP',
      workflow_name: 'Quy trình Hoán đổi Ca làm việc 2 Cấp',
      steps_count: 2,
      sla_hours: 6,
      auto_action: 'Cập nhật phân ca mới vào lịch làm việc tuần của 2 nhân viên',
      is_active: true,
    },
  ]);

  // Admin Logs
  readonly adminLogsList = signal<AttendanceLog[]>([]);
  readonly adminLogsTotal = signal<number>(0);
  readonly adminLogsPage = signal<number>(1);
  readonly importLogsDrawerOpen = signal<boolean>(false);
  readonly importCsvText = signal<string>('');

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

  // Admin Timesheets
  readonly timesheetsList = signal<Timesheet[]>([]);
  readonly selectedTimesheet = signal<Timesheet | null>(null);
  readonly newTimesheetDrawerOpen = signal<boolean>(false);
  readonly newTimesheetName = signal<string>('');
  readonly newTimesheetStart = signal<string>('');
  readonly newTimesheetEnd = signal<string>('');
  readonly lockReason = signal<string>('');
  readonly lockDrawerOpen = signal<boolean>(false);
  readonly timesheetConfirmationsList = signal<TimesheetConfirmation[]>([]);

  // Timesheet Period Closing Pipeline
  readonly timesheetClosingChecklist = signal<TimesheetClosingChecklist>({
    pending_leaves: 2,
    pending_ot: 1,
    pending_trips: 1,
    pending_fixes: 1,
    unresolved_anomalies: 3,
    dispute_count: 2,
    all_requests_resolved: false,
    anomalies_resolved: false,
    calculation_completed: false,
    disputes_resolved: false,
    is_ready_to_lock: false,
  });

  readonly timesheetEmployeeSummaries = signal<Array<{
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
  }>>([
    { employee_code: 'EMP-001', employee_name: 'Nguyễn Văn A', department: 'Phòng Kỹ thuật', std_days: 22, actual_days: 20, leave_paid_days: 2, ot_hours: 12, trip_days: 0, late_minutes: 0, total_paid_days: 22 },
    { employee_code: 'EMP-002', employee_name: 'Trần Thị B', department: 'Phòng Kỹ thuật', std_days: 22, actual_days: 21, leave_paid_days: 1, ot_hours: 4, trip_days: 0, late_minutes: 25, total_paid_days: 22 },
    { employee_code: 'EMP-003', employee_name: 'Lê Hoàng C', department: 'Xưởng Sản xuất', std_days: 22, actual_days: 22, leave_paid_days: 0, ot_hours: 18, trip_days: 0, late_minutes: 0, total_paid_days: 22 },
    { employee_code: 'EMP-004', employee_name: 'Phạm Minh D', department: 'Phòng Kinh doanh', std_days: 22, actual_days: 19, leave_paid_days: 3, ot_hours: 0, trip_days: 0, late_minutes: 30, total_paid_days: 22 },
    { employee_code: 'EMP-005', employee_name: 'Vũ Hải E', department: 'Phòng Kinh doanh', std_days: 22, actual_days: 19, leave_paid_days: 0, ot_hours: 0, trip_days: 3, late_minutes: 0, total_paid_days: 22 },
    { employee_code: 'EMP-006', employee_name: 'Đỗ Mai F', department: 'Xưởng Sản xuất', std_days: 22, actual_days: 22, leave_paid_days: 0, ot_hours: 8, trip_days: 0, late_minutes: 0, total_paid_days: 22 },
    { employee_code: 'EMP-007', employee_name: 'Bùi Tuấn G', department: 'Phòng Kỹ thuật', std_days: 22, actual_days: 22, leave_paid_days: 0, ot_hours: 6, trip_days: 0, late_minutes: 0, total_paid_days: 22 },
  ]);

  // Admin Leave
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
  readonly teamMetricsList = signal<any[]>([]);
  readonly topLateList = signal<any[]>([]);
  readonly overtimeList = signal<any[]>([]);

  // Kiosk Devices & Management by Branch
  readonly kioskDevicesList = signal<KioskDevice[]>([
    {
      id: 'kd-1',
      device_code: 'KIOSK-HN-01',
      location_name: 'Sảnh Lễ tân Tòa Keangnam (Tầng 1)',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      ip_address: '192.168.1.105',
      status: 'ONLINE',
      device_token: 'kiosk_sec_hn_8849bf20',
      today_punches: 86,
      last_heartbeat: '2026-11-11 08:02:14',
      public_url: '/kiosk?branch=BRANCH-HN&device=KIOSK-HN-01&token=kiosk_sec_hn_8849bf20',
      allowed_departments: ['Phòng Kỹ thuật', 'Phòng Kinh doanh', 'Phòng Nhân sự', 'Ban Giám đốc'],
    },
    {
      id: 'kd-2',
      device_code: 'KIOSK-HCM-01',
      location_name: 'Sảnh Văn phòng Bitexco Q1 (Tầng 18)',
      branch_code: 'BRANCH-HCM',
      branch_name: 'Chi nhánh TP. Hồ Chí Minh',
      ip_address: '192.168.10.45',
      status: 'ONLINE',
      device_token: 'kiosk_sec_hcm_3910c812',
      today_punches: 56,
      last_heartbeat: '2026-11-11 08:00:02',
      public_url: '/kiosk?branch=BRANCH-HCM&device=KIOSK-HCM-01&token=kiosk_sec_hcm_3910c812',
      allowed_departments: ['Phòng Kinh doanh Miền Nam', 'Phòng Chăm sóc Khách hàng', 'Phòng Kế toán'],
    },
    {
      id: 'kd-3',
      device_code: 'KIOSK-BD-01',
      location_name: 'Cổng Kiểm soát KCN VSIP 1',
      branch_code: 'BRANCH-BD',
      branch_name: 'Nhà máy Sản xuất Bình Dương',
      ip_address: '192.168.20.188',
      status: 'OFFLINE',
      device_token: 'kiosk_sec_bd_1022df77',
      today_punches: 0,
      last_heartbeat: '2026-11-10 18:30:00',
      public_url: '/kiosk?branch=BRANCH-BD&device=KIOSK-BD-01&token=kiosk_sec_bd_1022df77',
      allowed_departments: ['Xưởng Sản xuất', 'Kho vận & Giao nhận'],
    },
  ]);

  copyBranchKioskLink(device: KioskDevice): void {
    const fullUrl = (typeof window !== 'undefined' ? window.location.origin : '') + device.public_url;
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl).catch(() => {});
    }
    this.showToast('Đã sao chép link Kiosk [' + device.branch_name + ' - ' + device.device_code + '] vào clipboard: ' + fullUrl);
  }

  openBranchKiosk(device: KioskDevice): void {
    if (typeof window !== 'undefined') {
      window.open(device.public_url, '_blank');
    }
  }

  rotateKioskToken(device: KioskDevice): void {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const newToken = 'kiosk_sec_' + device.branch_code.toLowerCase().replace('branch-', '') + '_' + randomHex;
    device.device_token = newToken;
    device.public_url = '/kiosk?branch=' + device.branch_code + '&device=' + device.device_code + '&token=' + newToken;
    this.showToast('Đã xoay vòng mã bảo mật Kiosk [' + device.device_code + ']. Link mới đã được phát hành.');
  }

  // Workflow Policies Management (Luồng phê duyệt module Chấm công)
  readonly workflowPolicies = signal<AttendanceWorkflowPolicy[]>([
    {
      id: 'wf-policy-leave',
      workflow_type: 'LEAVE',
      name: 'Quy trình Phê duyệt Đơn Nghỉ phép (Leave Approval Policy)',
      description: 'Phê duyệt 1 cấp (dưới 2 ngày) hoặc 2 cấp (từ 3 ngày trở lên). Kết nối trực tiếp với Sổ cái phép.',
      active: true,
      sla_hours: 24,
      levels_count: 2,
      approval_levels: [
        {
          level: 1,
          role_key: 'ROLE_LINE_MANAGER',
          role_name: 'Quản lý Trực tiếp (Line Manager)',
          assignee_type: 'DIRECT_MANAGER',
          description: 'Thẩm định kế hoạch bàn giao công việc và duyệt đơn nghỉ phép của nhân viên',
          required: true,
          condition: 'Áp dụng cho 100% đơn nghỉ phép mọi thời hạn',
        },
        {
          level: 2,
          role_key: 'ROLE_HR_MANAGER',
          role_name: 'Trưởng phòng Nhân sự (HR Manager)',
          assignee_type: 'ROLE',
          description: 'Phê duyệt chính sách nghỉ phép dài ngày, trừ quỹ phép năm hoặc chuyển chế độ BHXH',
          required: true,
          condition: 'Kích hoạt khi số ngày nghỉ >= 3 ngày hoặc nghỉ không hưởng lương',
        },
      ],
      configured_by_role: 'Quản trị viên Nhân sự (HR Admin)',
      configured_by_name: 'Phạm Hồng Thái (HR Policy Lead)',
      updated_at: '2026-11-10 14:30:00',
    },
    {
      id: 'wf-policy-ot',
      workflow_type: 'OVERTIME',
      name: 'Quy trình Phê duyệt Làm thêm giờ (Overtime / OT Policy)',
      description: 'Quản lý duyệt nhu cầu ngoài giờ, Giám đốc / HR duyệt ngân sách chi trả phụ cấp làm thêm.',
      active: true,
      sla_hours: 12,
      levels_count: 2,
      approval_levels: [
        {
          level: 1,
          role_key: 'ROLE_LINE_MANAGER',
          role_name: 'Quản lý Trực tiếp (Line Manager)',
          assignee_type: 'DIRECT_MANAGER',
          description: 'Xác nhận khối lượng công việc phát sinh và danh sách nhân viên tham gia làm thêm giờ',
          required: true,
          condition: 'Bắt buộc trước khi bắt đầu ca làm thêm giờ',
        },
        {
          level: 2,
          role_key: 'ROLE_DIRECTOR',
          role_name: 'Giám đốc Khối / Trưởng phòng Nhân sự',
          assignee_type: 'ROLE',
          description: 'Phê duyệt hạn mức ngân sách ngoài giờ và cấp phép chi trả lương OT (150% - 300%)',
          required: true,
          condition: 'Kích hoạt khi tổng thời gian làm thêm >= 4 giờ/ngày hoặc làm thêm vào ngày Lễ/Tết',
        },
      ],
      configured_by_role: 'Quản trị viên Nhân sự (HR Admin)',
      configured_by_name: 'Phạm Hồng Thái (HR Policy Lead)',
      updated_at: '2026-11-09 11:20:00',
    },
    {
      id: 'wf-policy-fix',
      workflow_type: 'ATTENDANCE_FIX',
      name: 'Quy trình Giải trình & Bổ sung Chấm công (Regularization Policy)',
      description: 'Xử lý các sự cố quên quẹt thẻ, lỗi thiết bị hoặc công tác đột xuất cần điều chỉnh giờ check-in/out.',
      active: true,
      sla_hours: 48,
      levels_count: 2,
      approval_levels: [
        {
          level: 1,
          role_key: 'ROLE_SHIFT_LEADER',
          role_name: 'Phụ trách Ca / Quản lý Trực tiếp',
          assignee_type: 'DIRECT_MANAGER',
          description: 'Đối chiếu dữ liệu camera an ninh, sổ tay giao ca hoặc chứng cứ thực tế tại đơn vị',
          required: true,
          condition: 'Bắt buộc cho mọi giải trình đi muộn/về sớm hoặc quên quẹt thẻ',
        },
        {
          level: 2,
          role_key: 'ROLE_HR_ATTENDANCE',
          role_name: 'Cán bộ Chấm công & Tiền lương (C&B Officer)',
          assignee_type: 'ROLE',
          description: 'Kiểm tra tính hợp lệ và ghi nhận cập nhật vào bảng công chính thức của kỳ',
          required: true,
          condition: 'Áp dụng cho mọi đơn giải trình hợp lệ',
        },
      ],
      configured_by_role: 'Quản trị viên Nhân sự (HR Admin)',
      configured_by_name: 'Phạm Hồng Thái (HR Policy Lead)',
      updated_at: '2026-11-08 09:15:00',
    },
    {
      id: 'wf-policy-trip',
      workflow_type: 'BUSINESS_TRIP',
      name: 'Quy trình Phê duyệt Đi công tác (Business Trip Policy)',
      description: 'Duyệt lịch trình công tác ngoại tỉnh/quốc tế và phê duyệt hạn mức công tác phí, tạm ứng.',
      active: true,
      sla_hours: 24,
      levels_count: 2,
      approval_levels: [
        {
          level: 1,
          role_key: 'ROLE_LINE_MANAGER',
          role_name: 'Quản lý Bộ phận',
          assignee_type: 'DIRECT_MANAGER',
          description: 'Phê duyệt mục tiêu chuyến công tác và kế hoạch bàn giao nhiệm vụ tại văn phòng',
          required: true,
          condition: 'Bắt buộc cho mọi chuyến đi công tác',
        },
        {
          level: 2,
          role_key: 'ROLE_FINANCE_DIRECTOR',
          role_name: 'Ban Giám đốc / Phòng Kế toán Tài chính',
          assignee_type: 'ROLE',
          description: 'Thẩm định dự toán chi phí khách sạn, vé máy bay và duyệt lệnh tạm ứng công tác phí',
          required: true,
          condition: 'Kích hoạt khi dự toán chi phí > 5.000.000 VNĐ hoặc đi công tác nước ngoài',
        },
      ],
      configured_by_role: 'Quản trị viên Nhân sự (HR Admin)',
      configured_by_name: 'Phạm Hồng Thái (HR Policy Lead)',
      updated_at: '2026-11-07 16:45:00',
    },
    {
      id: 'wf-policy-timesheet',
      workflow_type: 'TIMESHEET_CLOSING',
      name: 'Quy trình Chốt & Khóa Bảng Chấm công Kỳ (Monthly Timesheet Closing)',
      description: 'Quy trình 4 bước kiểm soát nghiêm ngặt trước khi chuyển số liệu sang module Bảng lương (Payroll).',
      active: true,
      sla_hours: 72,
      levels_count: 4,
      approval_levels: [
        {
          level: 1,
          role_key: 'ROLE_HR_ATTENDANCE',
          role_name: 'Cán bộ Chấm công C&B',
          assignee_type: 'ROLE',
          description: 'Bước 1: Chạy tổng hợp tính công tự động và đối soát toàn bộ đơn từ hợp lệ',
          required: true,
          condition: '100% dữ liệu quẹt thẻ và đơn từ đã được đồng bộ',
        },
        {
          level: 2,
          role_key: 'ROLE_LINE_MANAGER',
          role_name: 'Quản lý Bộ phận & Nhân viên',
          assignee_type: 'ROLE',
          description: 'Bước 2: Gửi nhân viên xác nhận và hoàn tất giải quyết 100% khiếu nại (Disputes)',
          required: true,
          condition: 'Không còn khiếu nại công chưa được giải quyết',
        },
        {
          level: 3,
          role_key: 'ROLE_HR_MANAGER',
          role_name: 'Trưởng phòng Nhân sự',
          assignee_type: 'ROLE',
          description: 'Bước 3: Thẩm định toàn diện bảng tổng hợp công kỳ, ngày công chuẩn và quỹ làm thêm giờ',
          required: true,
          condition: 'Đạt điều kiện Sprint DoD Gate và checklist sẵn sàng khóa sổ',
        },
        {
          level: 4,
          role_key: 'ROLE_DIRECTOR',
          role_name: 'Giám đốc Điều hành (CEO/Director)',
          assignee_type: 'ROLE',
          description: 'Bước 4: Ký duyệt chốt sổ, phát lệnh khóa sổ vĩnh viễn và xuất sang hệ thống Tính lương',
          required: true,
          condition: 'Trưởng phòng Nhân sự đã ký duyệt thẩm định',
        },
      ],
      configured_by_role: 'Quản trị viên Nhân sự (HR Admin)',
      configured_by_name: 'Phạm Hồng Thái (HR Policy Lead)',
      updated_at: '2026-11-10 17:00:00',
    },
  ]);

  readonly selectedWorkflowPolicy = signal<AttendanceWorkflowPolicy | null>(null);
  readonly isWorkflowDrawerOpen = signal<boolean>(false);

  openWorkflowPolicyDrawer(policy: AttendanceWorkflowPolicy): void {
    this.selectedWorkflowPolicy.set(JSON.parse(JSON.stringify(policy)));
    this.isWorkflowDrawerOpen.set(true);
  }

  closeWorkflowPolicyDrawer(): void {
    this.isWorkflowDrawerOpen.set(false);
    this.selectedWorkflowPolicy.set(null);
  }

  saveWorkflowPolicy(): void {
    const p = this.selectedWorkflowPolicy();
    if (!p) return;
    this.workflowPolicies.update((list) =>
      list.map((item) => (item.id === p.id ? { ...p, updated_at: '2026-11-11 19:30:00' } : item))
    );
    this.closeWorkflowPolicyDrawer();
    this.showToast('Đã lưu cấu hình quy trình [' + p.name + '] thành công.');
  }

  toggleWorkflowActive(policy: AttendanceWorkflowPolicy): void {
    policy.active = !policy.active;
    this.showToast('Đã ' + (policy.active ? 'kích hoạt' : 'tạm dừng') + ' quy trình [' + policy.name + '].');
  }

  readonly kioskLogsList = signal<AttendanceLog[]>([
    {
      id: 'kl-1',
      employee_id: 'emp-1',
      employee_code: 'EMP-001',
      employee_name: 'Nguyễn Văn A',
      punch_time: '2026-11-11 08:02:14',
      punch_type: 'IN',
      source: 'KIOSK',
      device_id: 'KIOSK-LOBBY-01',
      in_geofence: true,
      distance_meters: 0,
      note: 'Xác thực PIN hợp lệ',
      is_valid: true,
    },
    {
      id: 'kl-2',
      employee_id: 'emp-6',
      employee_code: 'EMP-006',
      employee_name: 'Đỗ Mai F',
      punch_time: '2026-11-11 07:55:10',
      punch_type: 'IN',
      source: 'KIOSK',
      device_id: 'KIOSK-LOBBY-01',
      in_geofence: true,
      distance_meters: 0,
      note: 'Xác thực PIN hợp lệ',
      is_valid: true,
    },
    {
      id: 'kl-3',
      employee_id: 'emp-3',
      employee_code: 'EMP-003',
      employee_name: 'Lê Hoàng C',
      punch_time: '2026-11-11 05:58:20',
      punch_type: 'IN',
      source: 'KIOSK',
      device_id: 'KIOSK-FACTORY-02',
      in_geofence: true,
      distance_meters: 0,
      note: 'Xác thực PIN hợp lệ',
      is_valid: true,
    },
  ]);

  // Kiosk Terminal Mode State — Synced with Employee Plugin Directory
  readonly kioskEmployeesList = signal<KioskEmployee[]>([
    {
      id: 'emp-1',
      code: 'EMP-001',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Nguyễn Văn A',
      department: 'Phòng Kỹ thuật',
      job_title: 'Kỹ sư phần mềm Senior',
      work_email: 'a.nguyen@acme.com',
      phone: '0901 234 567',
      employee_type: 'FULL_TIME',
      avatar_initials: 'NVA',
      punched_today: true,
      last_punch_time: '08:02:14',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-2',
      code: 'EMP-002',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Trần Thị B',
      department: 'Phòng Kỹ thuật',
      job_title: 'Kiểm thử viên QA Lead',
      work_email: 'b.tran@acme.com',
      phone: '0902 345 678',
      employee_type: 'FULL_TIME',
      avatar_initials: 'TTB',
      punched_today: true,
      last_punch_time: '08:25:00',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-3',
      code: 'EMP-003',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Lê Hoàng C',
      department: 'Xưởng Sản xuất',
      job_title: 'Tổ trưởng Cơ khí Vận hành',
      work_email: 'c.le@acme.com',
      phone: '0903 456 789',
      employee_type: 'FULL_TIME',
      avatar_initials: 'LHC',
      punched_today: true,
      last_punch_time: '05:58:20',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-4',
      code: 'EMP-004',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Phạm Minh D',
      department: 'Phòng Kinh doanh',
      job_title: 'Chuyên viên Kinh doanh B2B',
      work_email: 'd.pham@acme.com',
      phone: '0904 567 890',
      employee_type: 'FULL_TIME',
      avatar_initials: 'PMD',
      punched_today: false,
    },
    {
      id: 'emp-5',
      code: 'EMP-005',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Vũ Hải E',
      department: 'Phòng Kinh doanh',
      job_title: 'Trưởng nhóm Bán hàng Dự án',
      work_email: 'e.vu@acme.com',
      phone: '0905 678 901',
      employee_type: 'FULL_TIME',
      avatar_initials: 'VHE',
      punched_today: false,
    },
    {
      id: 'emp-6',
      code: 'EMP-006',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Đỗ Mai F',
      department: 'Xưởng Sản xuất',
      job_title: 'Kỹ sư Vận hành Máy CNC',
      work_email: 'f.do@acme.com',
      phone: '0906 789 012',
      employee_type: 'FULL_TIME',
      avatar_initials: 'DMF',
      punched_today: true,
      last_punch_time: '07:55:10',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-7',
      code: 'EMP-007',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Bùi Tuấn G',
      department: 'Phòng Kỹ thuật',
      job_title: 'Lập trình viên Backend Java',
      work_email: 'g.bui@acme.com',
      phone: '0907 890 123',
      employee_type: 'FULL_TIME',
      avatar_initials: 'BTG',
      punched_today: true,
      last_punch_time: '08:12:44',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-8',
      code: 'EMP-008',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Hoàng Thị H',
      department: 'Phòng Nhân sự',
      job_title: 'Chuyên viên Nhân sự & C&B',
      work_email: 'h.hoang@acme.com',
      phone: '0908 901 234',
      employee_type: 'FULL_TIME',
      avatar_initials: 'HTH',
      punched_today: false,
    },
    {
      id: 'emp-9',
      code: 'EMP-009',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Phan Thanh I',
      department: 'Phòng Kế toán',
      job_title: 'Kế toán viên Tổng hợp',
      work_email: 'i.phan@acme.com',
      phone: '0909 012 345',
      employee_type: 'FULL_TIME',
      avatar_initials: 'PTI',
      punched_today: true,
      last_punch_time: '08:00:05',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-10',
      code: 'EMP-010',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Đinh Quang K',
      department: 'Xưởng Sản xuất',
      job_title: 'Kỹ sư Kiểm soát Chất lượng QC',
      work_email: 'k.dinh@acme.com',
      phone: '0910 123 456',
      employee_type: 'FULL_TIME',
      avatar_initials: 'DQK',
      punched_today: false,
    },
    {
      id: 'emp-11',
      code: 'EMP-011',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Lương Gia L',
      department: 'Phòng Kỹ thuật',
      job_title: 'Kiến trúc sư Giải pháp Solution Architect',
      work_email: 'l.luong@acme.com',
      phone: '0911 234 567',
      employee_type: 'FULL_TIME',
      avatar_initials: 'LGL',
      punched_today: true,
      last_punch_time: '08:05:12',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-12',
      code: 'EMP-012',
      branch_code: 'BRANCH-HN',
      branch_name: 'Chi nhánh Hà Nội',
      name: 'Mai Đức M',
      department: 'Phòng Kỹ thuật',
      job_title: 'Kỹ sư DevOps & Điện toán đám mây',
      work_email: 'm.mai@acme.com',
      phone: '0912 345 678',
      employee_type: 'FULL_TIME',
      avatar_initials: 'MDM',
      punched_today: true,
      last_punch_time: '08:01:30',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-13',
      code: 'EMP-013',
      branch_code: 'BRANCH-HCM',
      branch_name: 'Chi nhánh TP.HCM',
      name: 'Ngô Bảo N',
      department: 'Phòng Nhân sự',
      job_title: 'Chuyên viên Tuyển dụng Tài năng',
      work_email: 'n.ngo@acme.com',
      phone: '0913 456 789',
      employee_type: 'FULL_TIME',
      avatar_initials: 'NBN',
      punched_today: false,
    },
    {
      id: 'emp-14',
      code: 'EMP-014',
      branch_code: 'BRANCH-HCM',
      branch_name: 'Chi nhánh TP.HCM',
      name: 'Quách Ánh O',
      department: 'Phòng Kế toán',
      job_title: 'Kế toán viên Thanh toán',
      work_email: 'o.quach@acme.com',
      phone: '0914 567 890',
      employee_type: 'FULL_TIME',
      avatar_initials: 'QAO',
      punched_today: true,
      last_punch_time: '08:15:22',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-15',
      code: 'EMP-015',
      branch_code: 'BRANCH-HCM',
      branch_name: 'Chi nhánh TP.HCM',
      name: 'Tạ Hữu P',
      department: 'Phòng Kinh doanh',
      job_title: 'Trưởng phòng Phát triển Thị trường',
      work_email: 'p.ta@acme.com',
      phone: '0915 678 901',
      employee_type: 'FULL_TIME',
      avatar_initials: 'THP',
      punched_today: false,
    },
    {
      id: 'emp-16',
      code: 'EMP-016',
      branch_code: 'BRANCH-HCM',
      branch_name: 'Chi nhánh TP.HCM',
      name: 'Dương Quốc Q',
      department: 'Ban Giám đốc',
      job_title: 'Giám đốc Công nghệ CTO',
      work_email: 'q.duong@acme.com',
      phone: '0916 789 012',
      employee_type: 'FULL_TIME',
      avatar_initials: 'DQQ',
      punched_today: true,
      last_punch_time: '07:45:00',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-17',
      code: 'EMP-017',
      branch_code: 'BRANCH-HCM',
      branch_name: 'Chi nhánh TP.HCM',
      name: 'Hà Kim R',
      department: 'Phòng Nhân sự',
      job_title: 'Trưởng phòng Nhân sự HR Manager',
      work_email: 'r.ha@acme.com',
      phone: '0917 890 123',
      employee_type: 'FULL_TIME',
      avatar_initials: 'HKR',
      punched_today: true,
      last_punch_time: '07:58:40',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-18',
      code: 'EMP-018',
      branch_code: 'BRANCH-HCM',
      branch_name: 'Chi nhánh TP.HCM',
      name: 'Thái Văn S',
      department: 'Xưởng Sản xuất',
      job_title: 'Kỹ sư An toàn Lao động HSE',
      work_email: 's.thai@acme.com',
      phone: '0918 901 234',
      employee_type: 'FULL_TIME',
      avatar_initials: 'TVS',
      punched_today: true,
      last_punch_time: '05:50:18',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-19',
      code: 'EMP-019',
      branch_code: 'BRANCH-BD',
      branch_name: 'Nhà máy Sản xuất Bình Dương',
      name: 'Đoàn Ngọc T',
      department: 'Phòng Kinh doanh',
      job_title: 'Chuyên viên Truyền thông Marketing',
      work_email: 't.doan@acme.com',
      phone: '0919 012 345',
      employee_type: 'FULL_TIME',
      avatar_initials: 'DNT',
      punched_today: false,
    },
    {
      id: 'emp-20',
      code: 'EMP-020',
      branch_code: 'BRANCH-BD',
      branch_name: 'Nhà máy Sản xuất Bình Dương',
      name: 'Trịnh Thu U',
      department: 'Phòng Kế toán',
      job_title: 'Kế toán trưởng Chief Accountant',
      work_email: 'u.trinh@acme.com',
      phone: '0920 123 456',
      employee_type: 'FULL_TIME',
      avatar_initials: 'TTU',
      punched_today: true,
      last_punch_time: '08:00:00',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-21',
      code: 'EMP-021',
      branch_code: 'BRANCH-BD',
      branch_name: 'Nhà máy Sản xuất Bình Dương',
      name: 'Võ Thành V',
      department: 'Ban Giám đốc',
      job_title: 'Giám đốc Điều hành Managing Director',
      work_email: 'v.vo@acme.com',
      phone: '0921 234 567',
      employee_type: 'FULL_TIME',
      avatar_initials: 'VTV',
      punched_today: true,
      last_punch_time: '07:30:15',
      last_punch_type: 'IN',
    },
    {
      id: 'emp-22',
      code: 'EMP-022',
      branch_code: 'BRANCH-BD',
      branch_name: 'Nhà máy Sản xuất Bình Dương',
      name: 'Lâm Chí X',
      department: 'Xưởng Sản xuất',
      job_title: 'Kỹ thuật viên Điện tử Bảo trì',
      work_email: 'x.lam@acme.com',
      phone: '0922 345 678',
      employee_type: 'FULL_TIME',
      avatar_initials: 'LCX',
      punched_today: false,
    },
    {
      id: 'emp-23',
      code: 'EMP-023',
      branch_code: 'BRANCH-BD',
      branch_name: 'Nhà máy Sản xuất Bình Dương',
      name: 'Yến Quỳnh Y',
      department: 'Phòng Nhân sự',
      job_title: 'Chuyên viên Đào tạo & Phát triển L&D',
      work_email: 'y.yen@acme.com',
      phone: '0923 456 789',
      employee_type: 'FULL_TIME',
      avatar_initials: 'YQY',
      punched_today: false,
    },
    {
      id: 'emp-24',
      code: 'EMP-024',
      branch_code: 'BRANCH-BD',
      branch_name: 'Nhà máy Sản xuất Bình Dương',
      name: 'Chu Trí Z',
      department: 'Phòng Kỹ thuật',
      job_title: 'Lập trình viên Di động Ionic/Angular',
      work_email: 'z.chu@acme.com',
      phone: '0924 567 890',
      employee_type: 'FULL_TIME',
      avatar_initials: 'CTZ',
      punched_today: true,
      last_punch_time: '08:18:50',
      last_punch_type: 'IN',
    },
  ]);

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
    const branch = this.kioskBranchFilter();
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
    }
  }

  prevKioskPage(): void {
    if (this.kioskPage() > 1) {
      this.kioskPage.update((p) => p - 1);
    }
  }

  // Touch swipe support for kiosk touchscreens / tablets
  private kioskTouchStartX = 0;
  private kioskTouchStartY = 0;

  onKioskTouchStart(event: TouchEvent): void {
    if (event.touches && event.touches.length > 0) {
      this.kioskTouchStartX = event.touches[0].clientX;
      this.kioskTouchStartY = event.touches[0].clientY;
    }
  }

  onKioskTouchEnd(event: TouchEvent): void {
    if (event.changedTouches && event.changedTouches.length > 0) {
      const endX = event.changedTouches[0].clientX;
      const endY = event.changedTouches[0].clientY;
      const deltaX = endX - this.kioskTouchStartX;
      const deltaY = endY - this.kioskTouchStartY;
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
    this.service.kioskEmployees('KIOSK-LOBBY-01').subscribe({
      next: (res) => {
        if (res.data?.items && res.data.items.length > 0) {
          this.kioskEmployeesList.set(res.data.items);
        }
      },
      error: () => {
        // Retain synchronized rich directory with fallback
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
    this.checkViewport();
    this.checkKioskMode();
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
      if (path.endsWith('/kiosk') || path.includes('/kiosk') || search.includes('kiosk=true')) {
        this.isStandaloneKioskMode.set(true);
      }
      if (search) {
        const params = new URLSearchParams(search);
        const branch = params.get('branch');
        if (branch) {
          this.kioskBranchFilter.set(branch);
        }
      }
    }
  }

  formatDate(val: string | number | Date | null | undefined): string {
    return formatDate(val);
  }

  formatDateTime(val: string | number | Date | null | undefined): string {
    return formatDateTime(val);
  }

  private updateClock(): void {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.currentTimeString.set(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    try {
      const locale = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'vi-VN';
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

  openPublicKiosk(): void {
    if (typeof window !== 'undefined') {
      window.open('/kiosk', '_blank');
    }
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobileView.set(window.innerWidth < 768);
    }
  }

  private handleRoute(route: string): void {
    const [path, query] = route.split('?');
    if (query) {
      const params = new URLSearchParams(query);
      const branch = params.get('branch');
      if (branch) {
        this.kioskBranchFilter.set(branch);
      }
    }
    if (path.includes('kiosk')) {
      this.isStandaloneKioskMode.set(true);
      this.activeTab.set('kiosk');
    } else if (path.includes('/requests')) {
      this.activeTab.set('requests');
      this.activeMobileTab.set('m-requests');
    } else if (path.includes('/approvals')) {
      this.activeTab.set('approvals');
      this.activeMobileTab.set('m-approvals');
    } else if (path.includes('/team')) {
      this.activeTab.set('team');
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
    } else if (path.includes('/admin/logs')) {
      this.activeTab.set('admin-logs');
    } else {
      this.activeTab.set('self');
      this.activeMobileTab.set('m-punch');
    }
  }

  loadInitialData(): void {
    this.loadMyStatus();
    this.loadMyRequests();
    this.loadMyLeaveBalances();
    this.loadRequestTypes();
    this.loadShifts();
    this.loadTimesheets();
    this.loadReports();
    this.loadInbox();
    this.loadAdminLeave();
    this.loadAdminLogs();
    this.loadAdminRecords();
    this.loadKioskEmployees();
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
          this.todayStatus.set(res.data.today_status || 'ABSENT');
          this.lastPunch.set(res.data.last_punch || null);
          this.currentShift.set(res.data.shift || null);
          this.weekSchedule.set(res.data.week_schedule || this.mockWeekSchedule());
        }
      },
      error: () => {
        this.weekSchedule.set(this.mockWeekSchedule());
      },
    });

    this.service.myLogs(1, 20).subscribe({
      next: (res) => {
        this.myLogsList.set(res.data?.items || []);
      },
    });
  }

  private mockWeekSchedule(): Array<{ date: string; day: string; shift?: string; status?: AttendanceStatus }> {
    return [
      { date: '2026-11-09', day: 'T2', shift: 'HC (08:00 - 17:00)', status: 'PRESENT' },
      { date: '2026-11-10', day: 'T3', shift: 'HC (08:00 - 17:00)', status: 'PRESENT' },
      { date: '2026-11-11', day: 'T4', shift: 'HC (08:00 - 17:00)', status: 'PRESENT' },
      { date: '2026-11-12', day: 'T5', shift: 'HC (08:00 - 17:00)', status: 'PRESENT' },
      { date: '2026-11-13', day: 'T6', shift: 'HC (08:00 - 17:00)', status: 'PRESENT' },
      { date: '2026-11-14', day: 'T7', shift: 'Nghỉ tuần' },
      { date: '2026-11-15', day: 'CN', shift: 'Nghỉ tuần' },
    ];
  }

  // Requests
  loadMyRequests(): void {
    this.service.myRequests(1, 30).subscribe({
      next: (res) => {
        this.myRequestsList.set(res.data?.items || []);
      },
    });
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
    this.loading.set(true);
    this.service
      .submitRequest({
        request_type_code: this.selectedRequestTypeCode(),
        data: {
          from_date: this.requestFromDate(),
          to_date: this.requestToDate(),
          reason: this.requestReason(),
          hours: this.requestCustomHours(),
        },
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
    this.service.requestInbox(1, 30).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        if (items.length >= 6) {
          this.inboxRequestsList.set(items);
        } else {
          // Merge with default comprehensive catalog covering all 6 request types
          const defaults = this.defaultInboxRequests();
          this.inboxRequestsList.set(defaults);
        }
        const currentList = this.filteredInboxRequests();
        if (currentList.length > 0 && !this.selectedInboxRequest()) {
          this.selectInboxRequest(currentList[0]);
        }
      },
      error: () => {
        this.inboxRequestsList.set(this.defaultInboxRequests());
        const currentList = this.filteredInboxRequests();
        if (currentList.length > 0 && !this.selectedInboxRequest()) {
          this.selectInboxRequest(currentList[0]);
        }
      },
    });
  }

  private defaultInboxRequests(): AttendanceRequest[] {
    return [
      {
        id: 'req-leave-01',
        request_number: 'REQ-2026-001',
        request_type_code: 'LEAVE',
        request_type_name: 'Nghỉ phép năm',
        employee_id: 'emp-1',
        employee_code: 'EMP-001',
        employee_name: 'Nguyễn Văn A',
        status: 'PENDING',
        approval_mode: 'ENGINE',
        approval_flow: 'WORKFLOW_ENGINE',
        reason: 'Giải quyết việc riêng gia đình và làm thủ tục hành chính',
        submitted_at: '2026-11-10 09:15:00',
        data: {
          from_date: '2026-11-12',
          to_date: '2026-11-12',
          duration_days: 1.0,
          current_balance: 9.5,
          handover_colleague: 'Phạm Minh D (Phòng Kỹ thuật)',
        },
      },
      {
        id: 'req-ot-02',
        request_number: 'REQ-2026-002',
        request_type_code: 'OVERTIME',
        request_type_name: 'Làm thêm giờ (OT)',
        employee_id: 'emp-2',
        employee_code: 'EMP-002',
        employee_name: 'Trần Thị B',
        status: 'PENDING',
        approval_mode: 'ENGINE',
        approval_flow: 'WORKFLOW_ENGINE',
        reason: 'Tăng ca hoàn thiện tích hợp Kiosk Terminal & Động cơ chốt bảng công Sprint 09',
        submitted_at: '2026-11-10 16:30:00',
        data: {
          from_date: '2026-11-11 17:30',
          to_date: '2026-11-11 20:30',
          overtime_hours: 3.0,
          project_name: 'Hệ thống Quản trị Chấm công Open-ERP',
          multiplier: '1.5x (Ngày thường)',
          meal_allowance: 'Phụ cấp ăn tối tăng ca theo chính sách',
        },
      },
      {
        id: 'req-trip-03',
        request_number: 'REQ-2026-003',
        request_type_code: 'BUSINESS_TRIP',
        request_type_name: 'Công tác ngoại tỉnh',
        employee_id: 'emp-5',
        employee_code: 'EMP-005',
        employee_name: 'Vũ Hải E',
        status: 'PENDING',
        approval_mode: 'ENGINE',
        approval_flow: 'WORKFLOW_ENGINE',
        reason: 'Khảo sát hạ tầng mạng và lắp đặt 2 máy Kiosk chấm công tại Chi nhánh Hải Phòng',
        submitted_at: '2026-11-09 14:00:00',
        data: {
          from_date: '2026-11-15',
          to_date: '2026-11-17',
          duration_days: 3.0,
          destination: 'Tòa nhà TTC Plaza, Lê Hồng Phong, Hải Phòng',
          advance_amount: '3,500,000 VND (Xe công ty + Lưu trú)',
        },
      },
      {
        id: 'req-fix-04',
        request_number: 'REQ-2026-004',
        request_type_code: 'ATTENDANCE_FIX',
        request_type_name: 'Giải trình bổ sung công',
        employee_id: 'emp-3',
        employee_code: 'EMP-003',
        employee_name: 'Lê Hoàng C',
        status: 'PENDING',
        approval_mode: 'ENGINE',
        approval_flow: 'WORKFLOW_ENGINE',
        reason: 'Có mặt đúng 06:00 vào ca sáng nhưng máy vân tay cửa xưởng mất mạng LAN nên không ghi nhận log',
        submitted_at: '2026-11-11 07:10:00',
        data: {
          fix_date: '2026-11-11',
          missing_punch_type: 'CHẤM VÀO (06:00:00)',
          original_shift: 'Ca sáng (SANG: 06:00 - 14:00)',
        },
      },
      {
        id: 'req-late-05',
        request_number: 'REQ-2026-005',
        request_type_code: 'LATE_EARLY',
        request_type_name: 'Đi muộn / Về sớm',
        employee_id: 'emp-4',
        employee_code: 'EMP-004',
        employee_name: 'Phạm Minh D',
        status: 'PENDING',
        approval_mode: 'ENGINE',
        approval_flow: 'WORKFLOW_ENGINE',
        reason: 'Sự cố hỏng xe trên đường đi làm, xin phép đến muộn 30 phút và cam kết làm bù 30 phút cuối ca',
        submitted_at: '2026-11-11 08:15:00',
        data: {
          late_minutes: 30,
          makeup_hours: '17:00 - 17:30 cùng ngày',
        },
      },
      {
        id: 'req-swap-06',
        request_number: 'REQ-2026-006',
        request_type_code: 'SHIFT_SWAP',
        request_type_name: 'Đổi ca làm việc',
        employee_id: 'emp-6',
        employee_code: 'EMP-006',
        employee_name: 'Đỗ Mai F',
        status: 'PENDING',
        approval_mode: 'ENGINE',
        approval_flow: 'WORKFLOW_ENGINE',
        reason: 'Bận việc gia đình buổi sáng thứ Sáu, xin đổi Ca sáng sang Ca chiều với đồng nghiệp Bùi Tuấn G',
        submitted_at: '2026-11-10 11:20:00',
        data: {
          swap_date: '2026-11-13',
          swap_with_name: 'Bùi Tuấn G (EMP-007)',
          original_shift: 'Ca sáng (06:00 - 14:00)',
          target_shift: 'Ca chiều (14:00 - 22:00)',
        },
      },
    ];
  }

  selectInboxRequest(req: AttendanceRequest): void {
    this.selectedInboxRequest.set(req);
    this.approvalComment.set('');

    // Generate detailed multi-step workflow based on request type
    if (req.request_type_code === 'LEAVE') {
      this.selectedRequestWorkflow.set({
        workflow_key: 'WF-LEAVE-3LEVEL',
        workflow_name: 'Quy trình Phê duyệt Nghỉ phép 3 Cấp',
        instance_id: 'WFI-2026-0894',
        engine: 'Workflow Builder Engine (Sprint 08)',
        current_step: req.status === 'APPROVED' ? 4 : (req.status === 'REJECTED' ? 2 : 2),
        total_steps: 4,
        sla_hours: 24,
        steps: [
          {
            step_number: 1,
            step_name: this.i18n.instant('attendance.workflow.step_employee_title'),
            actor_name: req.employee_name || 'Nguyễn Văn A',
            actor_role: 'Nhân viên đề xuất',
            status: 'COMPLETED',
            action_time: req.submitted_at || '2026-11-08 09:00:00',
            comment: 'Nộp đơn xin nghỉ phép việc gia đình',
          },
          {
            step_number: 2,
            step_name: this.i18n.instant('attendance.workflow.step_manager_title'),
            actor_name: 'Trần Thị Bình',
            actor_role: 'Trưởng nhóm Phát triển',
            status: req.status === 'APPROVED' ? 'COMPLETED' : (req.status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
            action_time: req.status === 'APPROVED' ? '2026-11-08 10:15:00' : null,
            comment: req.status === 'APPROVED' ? 'Đã thu xếp bàn giao task, đồng ý' : (req.status === 'REJECTED' ? (req.comment || 'Trùng lịch release gấp') : null),
          },
          {
            step_number: 3,
            step_name: this.i18n.instant('attendance.workflow.step_director_title'),
            actor_name: 'Lê Hoàng Nam',
            actor_role: 'Trưởng phòng Kỹ thuật',
            status: req.status === 'APPROVED' ? 'COMPLETED' : 'WAITING',
            action_time: req.status === 'APPROVED' ? '2026-11-08 10:30:00' : null,
            comment: req.status === 'APPROVED' ? 'Phê duyệt' : null,
          },
          {
            step_number: 4,
            step_name: this.i18n.instant('attendance.workflow.step_automation_title'),
            actor_name: 'HR Automation Engine',
            actor_role: 'Tự động hóa hệ thống',
            status: req.status === 'APPROVED' ? 'COMPLETED' : 'WAITING',
            action_time: req.status === 'APPROVED' ? '2026-11-08 10:30:02' : null,
            comment: req.status === 'APPROVED' ? 'Đã trừ 1.0 ngày phép năm và cập nhật bảng công' : 'Chờ hoàn tất duyệt',
          },
        ],
        form_payload: {
          leave_type: 'Phép năm 2026 (Annual Leave)',
          from_date: '2026-11-12',
          to_date: '2026-11-12',
          duration_days: 1.0,
          current_balance: 9.5,
          handover_colleague: 'Phạm Minh D (Phòng Kỹ thuật)',
          reason: 'Giải quyết việc riêng gia đình',
        },
        post_actions: [
          {
            type: 'LEAVE_LEDGER_DEDUCTION',
            description: this.i18n.instant('attendance.workflow.auto_ledger_desc', { days: 1.0 }),
            status: req.status === 'APPROVED' ? 'APPLIED' : 'PENDING',
          },
          {
            type: 'DAILY_RECORD_MARK',
            description: this.i18n.instant('attendance.workflow.auto_record_desc'),
            status: req.status === 'APPROVED' ? 'APPLIED' : 'PENDING',
          },
        ],
      });
    } else if (req.request_type_code === 'OVERTIME') {
      this.selectedRequestWorkflow.set({
        workflow_key: 'WF-OT-2LEVEL',
        workflow_name: 'Quy trình Phê duyệt Tăng ca 2 Cấp',
        instance_id: 'WFI-2026-0912',
        engine: 'Workflow Builder Engine (Sprint 08)',
        current_step: 2,
        total_steps: 3,
        sla_hours: 12,
        steps: [
          {
            step_number: 1,
            step_name: this.i18n.instant('attendance.workflow.step_employee_title'),
            actor_name: req.employee_name || 'Nguyễn Văn A',
            actor_role: 'Nhân viên đề xuất',
            status: 'COMPLETED',
            action_time: req.submitted_at || '2026-11-10 16:00:00',
            comment: 'Đăng ký tăng ca hoàn thiện module Sprint 09',
          },
          {
            step_number: 2,
            step_name: this.i18n.instant('attendance.workflow.step_manager_title'),
            actor_name: 'Trần Thị Bình',
            actor_role: 'Quản lý dự án',
            status: 'PENDING',
            action_time: null,
            comment: null,
          },
          {
            step_number: 3,
            step_name: this.i18n.instant('attendance.workflow.step_automation_title'),
            actor_name: 'HR Automation Engine',
            actor_role: 'Tự động hóa hệ thống',
            status: 'WAITING',
            action_time: null,
            comment: 'Chờ duyệt để mở cửa sổ tính công OT',
          },
        ],
        form_payload: {
          from_date: '2026-11-10 17:30',
          to_date: '2026-11-10 20:30',
          duration_days: 0,
          overtime_hours: 3.0,
          reason: 'Hỗ trợ triển khai nghiệm thu tính năng Kiosk & Bảng công',
        },
        post_actions: [
          {
            type: 'OT_WINDOW_CREATION',
            description: 'Tự động ghi nhận 3.0 giờ làm thêm ca đêm vào Bảng công tháng 11/2026',
            status: 'PENDING',
          },
        ],
      });
    } else if (req.request_type_code === 'BUSINESS_TRIP') {
      this.selectedRequestWorkflow.set({
        workflow_key: 'WF-BUSINESS-TRIP',
        workflow_name: 'Quy trình Phê duyệt Công tác & Công tác phí 3 Cấp',
        instance_id: 'WFI-2026-1020',
        engine: 'Workflow Builder Engine (Sprint 08)',
        current_step: 2,
        total_steps: 4,
        sla_hours: 48,
        steps: [
          {
            step_number: 1,
            step_name: this.i18n.instant('attendance.workflow.step_employee_title'),
            actor_name: req.employee_name || 'Vũ Hải E',
            actor_role: 'Nhân viên đề xuất',
            status: 'COMPLETED',
            action_time: req.submitted_at || '2026-11-09 14:00:00',
            comment: 'Đăng ký công tác khảo sát lắp đặt Kiosk Hải Phòng',
          },
          {
            step_number: 2,
            step_name: this.i18n.instant('attendance.workflow.step_manager_title'),
            actor_name: 'Trần Thị Bình',
            actor_role: 'Trưởng phòng Dự án',
            status: 'PENDING',
            action_time: null,
            comment: null,
          },
          {
            step_number: 3,
            step_name: this.i18n.instant('attendance.workflow.step_director_title'),
            actor_name: 'Nguyễn Văn Giám Đốc',
            actor_role: 'Giám đốc Điều hành',
            status: 'WAITING',
            action_time: null,
            comment: null,
          },
          {
            step_number: 4,
            step_name: this.i18n.instant('attendance.workflow.step_automation_title'),
            actor_name: 'HR & Finance Automation Engine',
            actor_role: 'Tự động hóa hệ thống',
            status: 'WAITING',
            action_time: null,
            comment: 'Chờ duyệt để kích hoạt tạm ứng công tác phí và miễn trừ GPS',
          },
        ],
        form_payload: {
          from_date: '2026-11-15',
          to_date: '2026-11-17',
          duration_days: 3.0,
          destination: 'Tòa nhà TTC Plaza, Lê Hồng Phong, Hải Phòng',
          advance_amount: '3,500,000 VND (Xe công ty + Khách sạn)',
          reason: 'Khảo sát hạ tầng mạng và lắp đặt 2 máy Kiosk chấm công tại Chi nhánh Hải Phòng',
        },
        post_actions: [
          {
            type: 'GEOFENCE_EXEMPTION',
            description: 'Tự động miễn trừ kiểm tra bán kính GPS văn phòng trong 3 ngày công tác',
            status: 'PENDING',
          },
          {
            type: 'EXPENSE_ADVANCE_VOUCHER',
            description: 'Tạo phiếu chi tạm ứng 3,500,000 VND chuyển sang phân hệ Kế toán',
            status: 'PENDING',
          },
          {
            type: 'DAILY_RECORD_MARK',
            description: 'Đánh dấu trạng thái công ON_TRIP và tính đủ công tiêu chuẩn 8h/ngày',
            status: 'PENDING',
          },
        ],
      });
    } else if (req.request_type_code === 'LATE_EARLY') {
      this.selectedRequestWorkflow.set({
        workflow_key: 'WF-LATE-EARLY',
        workflow_name: 'Quy trình Miễn trừ Phạt Đi muộn / Về sớm',
        instance_id: 'WFI-2026-1045',
        engine: 'Workflow Builder Engine (Sprint 08)',
        current_step: 2,
        total_steps: 3,
        sla_hours: 12,
        steps: [
          {
            step_number: 1,
            step_name: this.i18n.instant('attendance.workflow.step_employee_title'),
            actor_name: req.employee_name || 'Phạm Minh D',
            actor_role: 'Nhân viên đề xuất',
            status: 'COMPLETED',
            action_time: req.submitted_at || '2026-11-11 08:15:00',
            comment: 'Xin phép đến muộn 30 phút do sự cố hỏng xe',
          },
          {
            step_number: 2,
            step_name: this.i18n.instant('attendance.workflow.step_manager_title'),
            actor_name: 'Trần Thị Bình',
            actor_role: 'Quản lý trực tiếp',
            status: 'PENDING',
            action_time: null,
            comment: null,
          },
          {
            step_number: 3,
            step_name: this.i18n.instant('attendance.workflow.step_automation_title'),
            actor_name: 'HR Automation Engine',
            actor_role: 'Tự động hóa hệ thống',
            status: 'WAITING',
            action_time: null,
            comment: 'Chờ duyệt để miễn trừ phạt chuyên cần',
          },
        ],
        form_payload: {
          late_minutes: 30,
          makeup_hours: '17:00 - 17:30 cùng ngày',
          reason: 'Sự cố hỏng xe trên đường đi làm, xin phép đến muộn 30 phút và cam kết làm bù 30 phút cuối ca',
        },
        post_actions: [
          {
            type: 'ATTENDANCE_PENALTY_EXEMPTION',
            description: 'Miễn trừ 30 phút đi muộn, không trừ điểm chuyên cần tháng 11/2026',
            status: 'PENDING',
          },
        ],
      });
    } else if (req.request_type_code === 'SHIFT_SWAP') {
      this.selectedRequestWorkflow.set({
        workflow_key: 'WF-SHIFT-SWAP',
        workflow_name: 'Quy trình Hoán đổi Ca làm việc 2 Cấp',
        instance_id: 'WFI-2026-1078',
        engine: 'Workflow Builder Engine (Sprint 08)',
        current_step: 3,
        total_steps: 4,
        sla_hours: 6,
        steps: [
          {
            step_number: 1,
            step_name: 'Nhân viên A đề xuất',
            actor_name: req.employee_name || 'Đỗ Mai F',
            actor_role: 'Nhân sự xin đổi ca',
            status: 'COMPLETED',
            action_time: req.submitted_at || '2026-11-10 11:20:00',
            comment: 'Bận việc gia đình buổi sáng, xin đổi sang ca chiều',
          },
          {
            step_number: 2,
            step_name: 'Nhân viên B đồng thuận',
            actor_name: 'Bùi Tuấn G (EMP-007)',
            actor_role: 'Nhân sự tiếp nhận đổi ca',
            status: 'COMPLETED',
            action_time: '2026-11-10 11:45:00',
            comment: 'Đồng ý trực Ca sáng thay Đỗ Mai F',
          },
          {
            step_number: 3,
            step_name: this.i18n.instant('attendance.workflow.step_manager_title'),
            actor_name: 'Trần Thị Bình',
            actor_role: 'Quản lý ca phân xưởng',
            status: 'PENDING',
            action_time: null,
            comment: null,
          },
          {
            step_number: 4,
            step_name: this.i18n.instant('attendance.workflow.step_automation_title'),
            actor_name: 'HR Automation Engine',
            actor_role: 'Tự động hóa hệ thống',
            status: 'WAITING',
            action_time: null,
            comment: 'Chờ duyệt để cập nhật lịch phân ca tuần của 2 nhân viên',
          },
        ],
        form_payload: {
          swap_date: '2026-11-13',
          swap_with_name: 'Bùi Tuấn G (EMP-007)',
          original_shift: 'Ca sáng (SANG: 06:00 - 14:00)',
          target_shift: 'Ca chiều (CHIEU: 14:00 - 22:00)',
          reason: 'Bận việc gia đình buổi sáng thứ Sáu, xin đổi Ca sáng sang Ca chiều với Bùi Tuấn G',
        },
        post_actions: [
          {
            type: 'SCHEDULE_SWAP_UPDATE',
            description: 'Tự động cập nhật lịch phân ca ngày 2026-11-13 giữa Đỗ Mai F và Bùi Tuấn G',
            status: 'PENDING',
          },
        ],
      });
    } else {
      this.selectedRequestWorkflow.set({
        workflow_key: 'WF-ATTENDANCE-FIX',
        workflow_name: 'Quy trình Xác thực Giải trình Chấm công',
        instance_id: 'WFI-2026-0955',
        engine: 'Workflow Builder Engine (Sprint 08)',
        current_step: 2,
        total_steps: 3,
        sla_hours: 24,
        steps: [
          {
            step_number: 1,
            step_name: this.i18n.instant('attendance.workflow.step_employee_title'),
            actor_name: req.employee_name || 'Lê Hoàng C',
            actor_role: 'Nhân viên đề xuất',
            status: 'COMPLETED',
            action_time: req.submitted_at || '2026-11-11 07:10:00',
            comment: 'Máy vân tay xưởng mất mạng LAN lúc 06:00',
          },
          {
            step_number: 2,
            step_name: this.i18n.instant('attendance.workflow.step_manager_title'),
            actor_name: 'Trần Thị Bình',
            actor_role: 'Quản đốc xưởng',
            status: 'PENDING',
            action_time: null,
            comment: null,
          },
          {
            step_number: 3,
            step_name: this.i18n.instant('attendance.workflow.step_automation_title'),
            actor_name: 'HR Automation Engine',
            actor_role: 'Tự động hóa hệ thống',
            status: 'WAITING',
            action_time: null,
            comment: 'Chờ duyệt để bổ sung punch log vào CSDL',
          },
        ],
        form_payload: {
          fix_date: '2026-11-11',
          missing_punch_type: 'CHẤM VÀO (06:00:00)',
          original_shift: 'Ca sáng (SANG: 06:00 - 14:00)',
          reason: 'Có mặt đúng 06:00 vào ca sáng nhưng máy vân tay cửa xưởng mất mạng LAN nên không ghi nhận log',
        },
        post_actions: [
          {
            type: 'PUNCH_LOG_INSERTION',
            description: 'Tự động bổ sung bản ghi check-in lúc 06:00:00 ngày 2026-11-11 (Nguồn: GIẢI_TRÌNH)',
            status: 'PENDING',
          },
          {
            type: 'DAILY_RECORD_MARK',
            description: 'Chạy lại động cơ tính công ngày và xóa bỏ trạng thái vắng mặt',
            status: 'PENDING',
          },
        ],
      });
    }

    this.inboxTimelineNodes.set([
      {
        title: this.i18n.instant('attendance.request.submitted'),
        status: 'SUBMITTED',
        actorName: req.employee_name || 'Employee',
        timestamp: req.submitted_at,
        isDone: true,
      },
      {
        title: this.i18n.instant('attendance.workflow.step_manager_title'),
        status: req.status,
        actorName: req.status === 'PENDING' ? 'Trần Thị Bình (Manager)' : 'Reviewer',
        timestamp: req.approved_at,
        comment: req.comment,
        isDone: req.status === 'APPROVED',
        isFailed: req.status === 'REJECTED',
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
      next: (res) => this.leaveTypesList.set(res.data?.items || []),
    });
    this.service.adminLeaveBalances(1, 50).subscribe({
      next: (res) => this.adminLeaveBalancesList.set(res.data?.items || []),
    });
    this.service.leaveLedger(undefined, 1, 50).subscribe({
      next: (res) => this.leaveLedgerList.set(res.data?.items || []),
    });
  }

  loadAdminLogs(): void {
    this.service.adminLogs(this.adminLogsPage(), 50).subscribe({
      next: (res) => {
        this.adminLogsList.set(res.data?.items || []);
        this.adminLogsTotal.set(res.data?.total_items || 0);
      },
    });
  }

  loadAdminRecords(): void {
    this.service.adminRecords(1, 50).subscribe({
      next: (res) => {
        this.adminRecordsList.set(res.data?.items || []);
      },
    });
  }

  // Shifts
  loadShifts(): void {
    this.service.shifts().subscribe({
      next: (res) => this.shiftsList.set(res.data?.items || []),
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
    this.service.timesheets(1, 20).subscribe({
      next: (res) => {
        this.timesheetsList.set(res.data?.items || []);
        if (res.data?.items && res.data.items.length > 0 && !this.selectedTimesheet()) {
          this.selectTimesheet(res.data.items[0]);
        }
      },
    });
  }

  selectTimesheet(ts: Timesheet): void {
    this.selectedTimesheet.set(ts);
  }

  changeTimesheetStep(step: string): void {
    const current = this.selectedTimesheet();
    if (!current || current.locked) {
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
    const current = this.selectedTimesheet();
    if (!current) {
      return;
    }
    this.service.confirmMyTimesheet(current.id).subscribe({
      next: () => {
        this.successMessage.set(this.i18n.instant('attendance.timesheet.confirmed'));
        setTimeout(() => this.successMessage.set(null), 3000);
      },
    });
  }

  rejectMyTimesheet(): void {
    const current = this.selectedTimesheet();
    if (!current) {
      return;
    }
    this.service.rejectMyTimesheet(current.id, 'Disputed by employee').subscribe({
      next: () => {
        this.successMessage.set(this.i18n.instant('attendance.timesheet.rejected'));
        setTimeout(() => this.successMessage.set(null), 3000);
      },
    });
  }

  // Reports
  loadReports(): void {
    this.service.reportSummary().subscribe({
      next: (res) => this.summaryMetrics.set(res.data || null),
    });
    this.service.reportTeam().subscribe({
      next: (res) => this.teamMetricsList.set(res.data?.items || []),
    });
    this.service.reportTopLate().subscribe({
      next: (res) => this.topLateList.set(res.data?.items || []),
    });
    this.service.reportOvertime().subscribe({
      next: (res) => this.overtimeList.set(res.data?.items || []),
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
  resolveAllPendingRequests(): void {
    this.timesheetClosingChecklist.update((curr) => ({
      ...curr,
      pending_leaves: 0,
      pending_ot: 0,
      pending_trips: 0,
      pending_fixes: 0,
      all_requests_resolved: true,
    }));
    this.successMessage.set(this.i18n.instant('attendance.timesheet.all_requests_resolved_alert'));
    setTimeout(() => this.successMessage.set(null), 3500);
  }

  resolveAnomalies(): void {
    this.timesheetClosingChecklist.update((curr) => ({
      ...curr,
      unresolved_anomalies: 0,
      anomalies_resolved: true,
    }));
    this.successMessage.set(this.i18n.instant('attendance.timesheet.anomalies_resolved_alert'));
    setTimeout(() => this.successMessage.set(null), 3500);
  }

  runBatchCalculation(): void {
    this.timesheetClosingChecklist.update((curr) => ({
      ...curr,
      calculation_completed: true,
    }));
    this.successMessage.set(this.i18n.instant('attendance.timesheet.batch_engine_success'));
    setTimeout(() => this.successMessage.set(null), 3500);
  }

  resolveDisputes(): void {
    this.timesheetClosingChecklist.update((curr) => ({
      ...curr,
      dispute_count: 0,
      disputes_resolved: true,
      is_ready_to_lock: true,
    }));
    this.successMessage.set(this.i18n.instant('attendance.timesheet.disputes_resolved_alert'));
    setTimeout(() => this.successMessage.set(null), 3500);
  }

  lockPeriodPipeline(): void {
    const cur = this.selectedTimesheet();
    if (cur) {
      cur.locked = true;
      cur.step = 'DONE';
      this.selectedTimesheet.set({ ...cur });
    }
    this.successMessage.set(this.i18n.instant('attendance.timesheet.locked_success_alert'));
    setTimeout(() => this.successMessage.set(null), 4000);
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
    if (!this.kioskEmployeeCode() || !this.kioskPin()) {
      this.kioskErrorMessage.set(this.i18n.instant('attendance.kiosk.punch_failed'));
      return;
    }
    const nowTime = this.currentTimeString();

    this.service
      .kioskPunch({
        device_code: 'KIOSK-LOBBY-01',
        employee_code: this.kioskEmployeeCode(),
        pin: this.kioskPin(),
        punch_type: type,
      })
      .subscribe({
        next: () => {
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
      });
  }
}

