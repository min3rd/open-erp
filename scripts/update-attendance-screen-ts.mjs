import fs from 'node:fs';

const filePath = 'plugins/attendance/web/src/app/attendance-screen.component.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
const oldImportShared = `import {
  AttendanceStatusBadgeComponent,
  ColorVariant,
  DrawerComponent,
  GpsIndicatorComponent,
  I18nService,
  LeaveBalanceCardComponent,
  PeriodStepperComponent,
  TimelineNode,
  TranslatePipe,
} from '@shared';`;

const newImportShared = `import {
  AttendanceStatusBadgeComponent,
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
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
} from '@shared';`;

code = code.replace(oldImportShared, newImportShared);

const oldModelImport = `import {
  AttendanceLog,
  AttendanceRecord,
  AttendanceRequest,
  AttendanceStatus,
  AttendanceSummary,
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
  WorkflowDefinitionCatalogItem,
} from './attendance.model';`;

const newModelImport = `import {
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
}`;

code = code.replace(oldModelImport, newModelImport);

// 2. Update AttendanceTab
const oldAttendanceTab = `type AttendanceTab =
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
  | 'kiosk';`;

const newAttendanceTab = `export type AttendanceTab =
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
  | 'kiosk';`;

code = code.replace(oldAttendanceTab, newAttendanceTab);

// 3. Update component imports array
const oldComponentImports = `  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DrawerComponent,
    AttendanceStatusBadgeComponent,
    LeaveBalanceCardComponent,
    PeriodStepperComponent,
    GpsIndicatorComponent,
  ],`;

const newComponentImports = `  imports: [
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
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpTextareaComponent,
  ],`;

code = code.replace(oldComponentImports, newComponentImports);

// 4. Update Inputs and add Toast & ScreenTabs
const oldInputSection = `  @Input() context: PluginContext | null = null;
  @Input() isStandaloneKiosk: boolean = false;
  @Input() set initialRoute(value: string) {
    if (value) {
      this.handleRoute(value);
    }
  }`;

const newInputSection = `  @Input() context: PluginContext | null = null;
  @Input() isStandaloneKiosk: boolean = false;
  @Input() set isMobile(val: boolean | string) {
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
  }`;

code = code.replace(oldInputSection, newInputSection);

// 5. Update kioskDevicesList
const oldKioskDevices = `  // Kiosk Devices & Management
  readonly kioskDevicesList = signal<KioskDevice[]>([
    {
      id: 'kd-1',
      device_code: 'KIOSK-LOBBY-01',
      location_name: 'Sảnh Lễ tân Tòa A (Tầng 1)',
      ip_address: '192.168.1.105',
      status: 'ONLINE',
      device_token: 'kiosk_tok_lobby_8849bf20',
      today_punches: 86,
      last_heartbeat: '2026-11-11 08:02:14',
      public_url: '/kiosk?device=KIOSK-LOBBY-01',
    },
    {
      id: 'kd-2',
      device_code: 'KIOSK-FACTORY-02',
      location_name: 'Cổng Phân xưởng Sản xuất 1',
      ip_address: '192.168.2.45',
      status: 'ONLINE',
      device_token: 'kiosk_tok_factory_3910c812',
      today_punches: 56,
      last_heartbeat: '2026-11-11 08:00:02',
      public_url: '/kiosk?device=KIOSK-FACTORY-02',
    },
    {
      id: 'kd-3',
      device_code: 'KIOSK-OFFICE-03',
      location_name: 'Cửa kho Logistics Tầng B1',
      ip_address: '192.168.1.188',
      status: 'OFFLINE',
      device_token: 'kiosk_tok_office_1022df77',
      today_punches: 0,
      last_heartbeat: '2026-11-10 18:30:00',
      public_url: '/kiosk?device=KIOSK-OFFICE-03',
    },
  ]);`;

const newKioskDevices = `  // Kiosk Devices & Management by Branch
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
  }`;

code = code.replace(oldKioskDevices, newKioskDevices);

// 6. Update employees to include branches
// emp-1 to emp-12: BRANCH-HN, Chi nhánh Hà Nội
// emp-13 to emp-18: BRANCH-HCM, Chi nhánh TP.HCM
// emp-19 to emp-24: BRANCH-BD, Nhà máy Sản xuất Bình Dương

code = code.replace(
  `      id: 'emp-1',\n      code: 'EMP-001',`,
  `      id: 'emp-1',\n      code: 'EMP-001',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-2',\n      code: 'EMP-002',`,
  `      id: 'emp-2',\n      code: 'EMP-002',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-3',\n      code: 'EMP-003',`,
  `      id: 'emp-3',\n      code: 'EMP-003',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-4',\n      code: 'EMP-004',`,
  `      id: 'emp-4',\n      code: 'EMP-004',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-5',\n      code: 'EMP-005',`,
  `      id: 'emp-5',\n      code: 'EMP-005',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-6',\n      code: 'EMP-006',`,
  `      id: 'emp-6',\n      code: 'EMP-006',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-7',\n      code: 'EMP-007',`,
  `      id: 'emp-7',\n      code: 'EMP-007',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-8',\n      code: 'EMP-008',`,
  `      id: 'emp-8',\n      code: 'EMP-008',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-9',\n      code: 'EMP-009',`,
  `      id: 'emp-9',\n      code: 'EMP-009',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-10',\n      code: 'EMP-010',`,
  `      id: 'emp-10',\n      code: 'EMP-010',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-11',\n      code: 'EMP-011',`,
  `      id: 'emp-11',\n      code: 'EMP-011',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);
code = code.replace(
  `      id: 'emp-12',\n      code: 'EMP-012',`,
  `      id: 'emp-12',\n      code: 'EMP-012',\n      branch_code: 'BRANCH-HN',\n      branch_name: 'Chi nhánh Hà Nội',`
);

code = code.replace(
  `      id: 'emp-13',\n      code: 'EMP-013',`,
  `      id: 'emp-13',\n      code: 'EMP-013',\n      branch_code: 'BRANCH-HCM',\n      branch_name: 'Chi nhánh TP.HCM',`
);
code = code.replace(
  `      id: 'emp-14',\n      code: 'EMP-014',`,
  `      id: 'emp-14',\n      code: 'EMP-014',\n      branch_code: 'BRANCH-HCM',\n      branch_name: 'Chi nhánh TP.HCM',`
);
code = code.replace(
  `      id: 'emp-15',\n      code: 'EMP-015',`,
  `      id: 'emp-15',\n      code: 'EMP-015',\n      branch_code: 'BRANCH-HCM',\n      branch_name: 'Chi nhánh TP.HCM',`
);
code = code.replace(
  `      id: 'emp-16',\n      code: 'EMP-016',`,
  `      id: 'emp-16',\n      code: 'EMP-016',\n      branch_code: 'BRANCH-HCM',\n      branch_name: 'Chi nhánh TP.HCM',`
);
code = code.replace(
  `      id: 'emp-17',\n      code: 'EMP-017',`,
  `      id: 'emp-17',\n      code: 'EMP-017',\n      branch_code: 'BRANCH-HCM',\n      branch_name: 'Chi nhánh TP.HCM',`
);
code = code.replace(
  `      id: 'emp-18',\n      code: 'EMP-018',`,
  `      id: 'emp-18',\n      code: 'EMP-018',\n      branch_code: 'BRANCH-HCM',\n      branch_name: 'Chi nhánh TP.HCM',`
);

code = code.replace(
  `      id: 'emp-19',\n      code: 'EMP-019',`,
  `      id: 'emp-19',\n      code: 'EMP-019',\n      branch_code: 'BRANCH-BD',\n      branch_name: 'Nhà máy Sản xuất Bình Dương',`
);
code = code.replace(
  `      id: 'emp-20',\n      code: 'EMP-020',`,
  `      id: 'emp-20',\n      code: 'EMP-020',\n      branch_code: 'BRANCH-BD',\n      branch_name: 'Nhà máy Sản xuất Bình Dương',`
);
code = code.replace(
  `      id: 'emp-21',\n      code: 'EMP-021',`,
  `      id: 'emp-21',\n      code: 'EMP-021',\n      branch_code: 'BRANCH-BD',\n      branch_name: 'Nhà máy Sản xuất Bình Dương',`
);
code = code.replace(
  `      id: 'emp-22',\n      code: 'EMP-022',`,
  `      id: 'emp-22',\n      code: 'EMP-022',\n      branch_code: 'BRANCH-BD',\n      branch_name: 'Nhà máy Sản xuất Bình Dương',`
);
code = code.replace(
  `      id: 'emp-23',\n      code: 'EMP-023',`,
  `      id: 'emp-23',\n      code: 'EMP-023',\n      branch_code: 'BRANCH-BD',\n      branch_name: 'Nhà máy Sản xuất Bình Dương',`
);
code = code.replace(
  `      id: 'emp-24',\n      code: 'EMP-024',`,
  `      id: 'emp-24',\n      code: 'EMP-024',\n      branch_code: 'BRANCH-BD',\n      branch_name: 'Nhà máy Sản xuất Bình Dương',`
);

// 7. Update Kiosk Branch Filter & computed branch
const oldKioskDeptFilter = `  readonly kioskDeptFilter = signal<string>('ALL');`;
const newKioskDeptFilter = `  readonly kioskBranchFilter = signal<string>('ALL');
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
  readonly kioskDeptFilter = signal<string>('ALL');`;

code = code.replace(oldKioskDeptFilter, newKioskDeptFilter);

// 8. Update filteredKioskEmployees to filter by branch
const oldFilteredKiosk = `  readonly filteredKioskEmployees = computed(() => {
    let list = this.kioskEmployeesList();
    const dept = this.kioskDeptFilter();`;

const newFilteredKiosk = `  readonly filteredKioskEmployees = computed(() => {
    let list = this.kioskEmployeesList();
    const branch = this.kioskBranchFilter();
    if (branch && branch !== 'ALL') {
      list = list.filter((e) => e.branch_code === branch);
    }
    const dept = this.kioskDeptFilter();`;

code = code.replace(oldFilteredKiosk, newFilteredKiosk);

// 9. Update handleRoute and ngOnInit to support branch query param
const oldHandleRoute = `  private handleRoute(route: string): void {
    if (route.includes('/requests')) {
      this.activeTab.set('requests');
      this.activeMobileTab.set('m-requests');
    } else if (route.includes('/approvals')) {
      this.activeTab.set('approvals');
      this.activeMobileTab.set('m-approvals');
    } else if (route.includes('/team')) {
      this.activeTab.set('team');
    } else if (route.includes('/admin/timesheets')) {
      this.activeTab.set('admin-timesheets');
    } else if (route.includes('/admin/logs')) {
      this.activeTab.set('admin-logs');
    } else if (route.includes('/admin/shifts')) {
      this.activeTab.set('admin-shifts');
    } else if (route.includes('/admin/records')) {
      this.activeTab.set('admin-records');
    } else if (route.includes('/admin/leave')) {
      this.activeTab.set('admin-leave');
    } else if (route.includes('/admin/reports')) {
      this.activeTab.set('admin-reports');
    } else if (route.includes('/kiosk')) {
      this.activeTab.set('kiosk');
    } else {
      this.activeTab.set('self');
      this.activeMobileTab.set('m-punch');
    }
  }`;

const newHandleRoute = `  private handleRoute(route: string): void {
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
  }`;

code = code.replace(oldHandleRoute, newHandleRoute);

// Update ngOnInit to read branch param from window.location
const oldNgOnInitCheck = `    if (this.isStandaloneKiosk) {
      this.isStandaloneKioskMode.set(true);
    }`;

const newNgOnInitCheck = `    if (this.isStandaloneKiosk) {
      this.isStandaloneKioskMode.set(true);
    }
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (url.includes('/kiosk')) {
        this.isStandaloneKioskMode.set(true);
      }
      if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const branchParam = params.get('branch');
        if (branchParam) {
          this.kioskBranchFilter.set(branchParam);
        }
      }
    }`;

code = code.replace(oldNgOnInitCheck, newNgOnInitCheck);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated attendance-screen.component.ts');

