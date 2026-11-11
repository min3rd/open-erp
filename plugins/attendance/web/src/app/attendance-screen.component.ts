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
  ColorVariant,
  DrawerComponent,
  GpsIndicatorComponent,
  I18nService,
  LeaveBalanceCardComponent,
  PeriodStepperComponent,
  RequestTimelineComponent,
  TimelineNode,
  TranslatePipe,
} from '@shared';
import {
  AttendanceLog,
  AttendanceRecord,
  AttendanceRequest,
  AttendanceStatus,
  AttendanceSummary,
  LeaveBalance,
  LeaveLedgerEntry,
  LeaveType,
  PunchType,
  RequestType,
  ShiftDefinition,
  Timesheet,
  TimesheetConfirmation,
} from './attendance.model';
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

type AttendanceTab =
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
    RequestTimelineComponent,
  ],
  templateUrl: './attendance-screen.component.html',
})
export class AttendanceScreenComponent implements OnInit {
  private service = inject(AttendanceService);
  private i18n = inject(I18nService);

  @Input() context: PluginContext | null = null;
  @Input() set initialRoute(value: string) {
    if (value) {
      this.handleRoute(value);
    }
  }

  // Active view states
  readonly activeTab = signal<AttendanceTab>('self');
  readonly activeMobileTab = signal<MobileTab>('m-punch');
  readonly isMobileView = signal<boolean>(false);
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
  readonly selectedInboxRequest = signal<AttendanceRequest | null>(null);
  readonly approvalComment = signal<string>('');
  readonly inboxTimelineNodes = signal<TimelineNode[]>([]);

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

  // Kiosk Mode
  readonly kioskEmployeeCode = signal<string>('');
  readonly kioskPin = signal<string>('');
  readonly kioskSuccessMessage = signal<string | null>(null);
  readonly kioskErrorMessage = signal<string | null>(null);

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
    this.loadInitialData();
    this.acquireGps();
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobileView.set(window.innerWidth < 768);
    }
  }

  private handleRoute(route: string): void {
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
        this.inboxRequestsList.set(res.data?.items || []);
        if (res.data?.items && res.data.items.length > 0 && !this.selectedInboxRequest()) {
          this.selectInboxRequest(res.data.items[0]);
        }
      },
    });
  }

  selectInboxRequest(req: AttendanceRequest): void {
    this.selectedInboxRequest.set(req);
    this.approvalComment.set('');
    this.inboxTimelineNodes.set([
      {
        title: this.i18n.instant('attendance.request.submitted'),
        status: 'SUBMITTED',
        actorName: req.employee_name || 'Employee',
        timestamp: req.submitted_at,
        isDone: true,
      },
      {
        title: this.i18n.instant('attendance.request.inbox'),
        status: req.status,
        actorName: req.status === 'PENDING' ? 'Pending Approval' : 'Reviewer',
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
          setTimeout(() => this.kioskClear(), 3500);
        },
        error: () => {
          this.kioskErrorMessage.set(this.i18n.instant('attendance.kiosk.punch_failed'));
        },
      });
  }
}

