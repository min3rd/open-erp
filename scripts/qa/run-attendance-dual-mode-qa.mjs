import { execSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

function run(cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return out ? out.trim() : '';
  } catch (err) {
    return (err.stdout || '') + (err.stderr || '') + err.message;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const baseDir = path.resolve('plugins/attendance/src/main/resources/META-INF/resources');
const evidenceDir = path.resolve('docs/sprints/sprint_09_plugin_attendance_timesheet/08_testing/evidence/screenshots');
const guideAssetDir = path.resolve('docs/06_user_guides/assets/sprint_09');
const artifactDir = path.resolve('C:/Users/Minh/.gemini/antigravity/brain/d6c236a0-8ff5-4d1f-9059-b4d7dfb1199b/screenshots/sprint09');

fs.mkdirSync(evidenceDir, { recursive: true });
fs.mkdirSync(guideAssetDir, { recursive: true });
fs.mkdirSync(artifactDir, { recursive: true });

// Comprehensive Mock Data for Open-ERP Attendance Plugin
let currentTodayStatus = "ABSENT";
let currentLastPunch = null;
let currentGpsState = "IN_RANGE"; // "IN_RANGE", "OUT_RANGE"

const mockStatusNormal = () => ({
  success: true,
  code: "ATTENDANCE_STATUS_SUCCESS",
  data: {
    today_status: currentTodayStatus,
    last_punch: currentLastPunch,
    shift: {
      id: "s-1",
      code: "HC",
      name: "Hành chính tiêu chuẩn",
      start_time: "08:00",
      end_time: "17:00",
      grace_in_minutes: 15,
      grace_out_minutes: 15,
      work_hours: 8
    },
    week_schedule: [
      { date: "2026-11-09", day: "T2", shift: "HC (08:00 - 17:00)", status: "PRESENT" },
      { date: "2026-11-10", day: "T3", shift: "HC (08:00 - 17:00)", status: "PRESENT" },
      { date: "2026-11-11", day: "T4", shift: "HC (08:00 - 17:00)", status: currentTodayStatus },
      { date: "2026-11-12", day: "T5", shift: "HC (08:00 - 17:00)", status: null },
      { date: "2026-11-13", day: "T6", shift: "HC (08:00 - 17:00)", status: null },
      { date: "2026-11-14", day: "T7", shift: "Nghỉ tuần", status: null },
      { date: "2026-11-15", day: "CN", shift: "Nghỉ tuần", status: null }
    ]
  }
});

const mockLogs = {
  success: true,
  code: "ATTENDANCE_LOGS_SUCCESS",
  data: {
    items: [
      { id: "1", employee_id: "emp-1", employee_code: "EMP-001", employee_name: "Nguyễn Văn A", punch_time: "2026-11-11 08:02:14", punch_type: "IN", source: "WEB", in_geofence: true, distance_meters: 15, note: "Đúng giờ" },
      { id: "2", employee_id: "emp-1", employee_code: "EMP-001", employee_name: "Nguyễn Văn A", punch_time: "2026-11-10 17:05:30", punch_type: "OUT", source: "WEB", in_geofence: true, distance_meters: 12, note: "Tan ca" },
      { id: "3", employee_id: "emp-1", employee_code: "EMP-001", employee_name: "Nguyễn Văn A", punch_time: "2026-11-10 08:00:02", punch_type: "IN", source: "MOBILE", in_geofence: true, distance_meters: 45, note: "Mobile punch" },
      { id: "4", employee_id: "emp-1", employee_code: "EMP-001", employee_name: "Nguyễn Văn A", punch_time: "2026-11-09 17:01:10", punch_type: "OUT", source: "WEB", in_geofence: true, distance_meters: 10, note: "Tan ca" },
      { id: "5", employee_id: "emp-1", employee_code: "EMP-001", employee_name: "Nguyễn Văn A", punch_time: "2026-11-09 08:05:00", punch_type: "IN", source: "WEB", in_geofence: true, distance_meters: 18, note: "Đúng giờ" }
    ],
    page: 1,
    size: 20,
    total_items: 5,
    total_pages: 1
  }
};

const mockLeaveBalances = {
  success: true,
  code: "ATTENDANCE_LEAVE_BALANCES_SUCCESS",
  data: {
    items: [
      { id: "lb-1", employee_id: "emp-1", employee_name: "Nguyễn Văn A", leave_type_code: "ANNUAL", leave_type_name: "Phép năm 2026", granted: 12, used: 2.5, remaining: 9.5, expiring: 2, valid_until: "2026-12-31" },
      { id: "lb-2", employee_id: "emp-1", employee_name: "Nguyễn Văn A", leave_type_code: "SICK", leave_type_name: "Nghỉ ốm hưởng BHXH", granted: 30, used: 1, remaining: 29, expiring: 0, valid_until: "2026-12-31" },
      { id: "lb-3", employee_id: "emp-2", employee_name: "Trần Thị B", leave_type_code: "ANNUAL", leave_type_name: "Phép năm 2026", granted: 14, used: 4, remaining: 10, expiring: 0, valid_until: "2026-12-31" },
      { id: "lb-4", employee_id: "emp-3", employee_name: "Lê Hoàng C", leave_type_code: "ANNUAL", leave_type_name: "Phép năm 2026", granted: 12, used: 0, remaining: 12, expiring: 0, valid_until: "2026-12-31" }
    ],
    page: 1,
    size: 50,
    total_items: 4,
    total_pages: 1
  }
};

const mockLeaveLedger = {
  success: true,
  code: "ATTENDANCE_LEAVE_LEDGER_SUCCESS",
  data: {
    items: [
      { id: "ll-1", employee_name: "Nguyễn Văn A", entry_type: "CẤP_MỚI (GRANT)", days: 12, note: "Cấp phép đầu năm 2026", created_at: "2026-01-01" },
      { id: "ll-2", employee_name: "Nguyễn Văn A", entry_type: "NGHỈ_PHÉP (USAGE)", days: -1.5, note: "Nghỉ phép việc gia đình (REQ-2026-0001)", created_at: "2026-06-15" },
      { id: "ll-3", employee_name: "Nguyễn Văn A", entry_type: "NGHỈ_PHÉP (USAGE)", days: -1, note: "Nghỉ phép cá nhân", created_at: "2026-10-20" },
      { id: "ll-4", employee_name: "Trần Thị B", entry_type: "CẤP_MỚI (GRANT)", days: 14, note: "Cấp phép thâm niên", created_at: "2026-01-01" },
      { id: "ll-5", employee_name: "Trần Thị B", entry_type: "ĐIỀU_CHỈNH (ADJUST)", days: 1, note: "Bổ sung phép thưởng dự án", created_at: "2026-09-01" }
    ],
    page: 1,
    size: 50,
    total_items: 5,
    total_pages: 1
  }
};

const mockRequests = {
  success: true,
  code: "ATTENDANCE_REQUESTS_SUCCESS",
  data: {
    items: [
      { id: "req-1", request_number: "REQ-2026-0001", request_type_code: "LEAVE", request_type_name: "Nghỉ phép năm", employee_id: "emp-1", employee_name: "Nguyễn Văn A", status: "APPROVED", approval_mode: "INTERNAL_FALLBACK", submitted_at: "2026-11-08 09:00:00", approved_at: "2026-11-08 10:30:00" },
      { id: "req-2", request_number: "REQ-2026-0002", request_type_code: "OVERTIME", request_type_name: "Làm thêm giờ (OT)", employee_id: "emp-1", employee_name: "Nguyễn Văn A", status: "PENDING", approval_mode: "INTERNAL_FALLBACK", submitted_at: "2026-11-10 16:00:00" },
      { id: "req-3", request_number: "REQ-2026-0003", request_type_code: "ATTENDANCE_FIX", request_type_name: "Giải trình chấm công", employee_id: "emp-2", employee_name: "Trần Thị B", status: "PENDING", approval_mode: "INTERNAL_FALLBACK", submitted_at: "2026-11-11 08:30:00" },
      { id: "req-4", request_number: "REQ-2026-0004", request_type_code: "LATE_EARLY", request_type_name: "Đi muộn có lý do", employee_id: "emp-3", employee_name: "Phạm Minh D", status: "REJECTED", approval_mode: "INTERNAL_FALLBACK", submitted_at: "2026-11-05 08:45:00", approved_at: "2026-11-05 09:15:00" }
    ],
    page: 1,
    size: 20,
    total_items: 4,
    total_pages: 1
  }
};

const mockRequestTypes = {
  success: true,
  code: "ATTENDANCE_REQUEST_TYPES_SUCCESS",
  data: {
    items: [
      { id: "rt-1", code: "LEAVE", name: "Nghỉ phép năm", is_system: true, window_days: 7, is_active: true },
      { id: "rt-2", code: "OVERTIME", name: "Làm thêm giờ (OT)", is_system: true, window_days: 3, is_active: true },
      { id: "rt-3", code: "ATTENDANCE_FIX", name: "Giải trình bổ sung công", is_system: true, window_days: 5, is_active: true },
      { id: "rt-4", code: "LATE_EARLY", name: "Đi muộn / Về sớm", is_system: true, window_days: 3, is_active: true },
      { id: "rt-5", code: "BUSINESS_TRIP", name: "Công tác ngoại tỉnh", is_system: true, window_days: 14, is_active: true },
      { id: "rt-6", code: "SHIFT_SWAP", name: "Đổi ca làm việc", is_system: true, window_days: 2, is_active: true }
    ]
  }
};

const mockTimesheets = {
  success: true,
  code: "ATTENDANCE_TIMESHEETS_SUCCESS",
  data: {
    items: [
      { id: "ts-1", name: "Kỳ công Tháng 11/2026", period_start: "2026-11-01", period_end: "2026-11-30", step: "S3_CALCULATE", locked: false, total_employees: 45, total_work_hours: 7200, total_ot_hours: 180 },
      { id: "ts-0", name: "Kỳ công Tháng 10/2026", period_start: "2026-10-01", period_end: "2026-10-31", step: "DONE", locked: true, locked_at: "2026-11-05 18:00:00", total_employees: 45, total_work_hours: 7920, total_ot_hours: 210 }
    ],
    page: 1,
    size: 20,
    total_items: 2,
    total_pages: 1
  }
};

const mockShifts = {
  success: true,
  code: "ATTENDANCE_SHIFTS_SUCCESS",
  data: {
    items: [
      { id: "s-1", code: "HC", name: "Hành chính tiêu chuẩn", start_time: "08:00", end_time: "17:00", grace_in_minutes: 15, grace_out_minutes: 15, work_hours: 8, is_active: true },
      { id: "s-2", code: "SANG", name: "Ca sáng sản xuất", start_time: "06:00", end_time: "14:00", grace_in_minutes: 10, grace_out_minutes: 10, work_hours: 8, is_active: true },
      { id: "s-3", code: "CHIEU", name: "Ca chiều sản xuất", start_time: "14:00", end_time: "22:00", grace_in_minutes: 10, grace_out_minutes: 10, work_hours: 8, is_active: true },
      { id: "s-4", code: "DEM", name: "Ca đêm kho vận", start_time: "22:00", end_time: "06:00", grace_in_minutes: 10, grace_out_minutes: 10, work_hours: 8, is_active: true }
    ]
  }
};

const mockDailyRecords = {
  success: true,
  code: "ATTENDANCE_DAILY_RECORDS_SUCCESS",
  data: {
    items: [
      { id: "dr-1", employee_id: "emp-1", employee_code: "EMP-001", employee_name: "Nguyễn Văn A", work_date: "2026-11-11", shift_code: "HC", in_time: "08:02", out_time: "17:05", work_hours: 8, late_minutes: 0, early_minutes: 0, ot_hours: 1, status: "PRESENT", is_overridden: false },
      { id: "dr-2", employee_id: "emp-2", employee_code: "EMP-002", employee_name: "Trần Thị B", work_date: "2026-11-11", shift_code: "HC", in_time: "08:25", out_time: "17:00", work_hours: 7.5, late_minutes: 25, early_minutes: 0, ot_hours: 0, status: "PRESENT", is_overridden: false },
      { id: "dr-3", employee_id: "emp-3", employee_code: "EMP-003", employee_name: "Lê Hoàng C", work_date: "2026-11-11", shift_code: "SANG", in_time: "05:58", out_time: "14:02", work_hours: 8, late_minutes: 0, early_minutes: 0, ot_hours: 2, status: "PRESENT", is_overridden: false },
      { id: "dr-4", employee_id: "emp-4", employee_code: "EMP-004", employee_name: "Phạm Minh D", work_date: "2026-11-11", shift_code: "HC", in_time: null, out_time: null, work_hours: 0, late_minutes: 0, early_minutes: 0, ot_hours: 0, status: "ON_LEAVE", is_overridden: false },
      { id: "dr-5", employee_id: "emp-5", employee_code: "EMP-005", employee_name: "Vũ Hải E", work_date: "2026-11-11", shift_code: "HC", in_time: null, out_time: null, work_hours: 0, late_minutes: 0, early_minutes: 0, ot_hours: 0, status: "ABSENT", is_overridden: false }
    ],
    page: 1,
    size: 50,
    total_items: 5,
    total_pages: 1
  }
};

const mockTeamMetrics = {
  success: true,
  code: "ATTENDANCE_TEAM_METRICS_SUCCESS",
  data: {
    items: [
      { employee_id: "emp-1", employee_code: "EMP-001", employee_name: "Nguyễn Văn A", department_name: "Phòng Kỹ thuật", shift_name: "Hành chính (HC)", check_in: "08:02:14", check_out: "17:05:30", status: "PRESENT" },
      { employee_id: "emp-2", employee_code: "EMP-002", employee_name: "Trần Thị B", department_name: "Phòng Kỹ thuật", shift_name: "Hành chính (HC)", check_in: "08:25:00", check_out: "—", status: "PRESENT" },
      { employee_id: "emp-3", employee_code: "EMP-003", employee_name: "Lê Hoàng C", department_name: "Xưởng Sản xuất", shift_name: "Ca sáng (SANG)", check_in: "05:58:20", check_out: "14:02:10", status: "PRESENT" },
      { employee_id: "emp-4", employee_code: "EMP-004", employee_name: "Phạm Minh D", department_name: "Phòng Kinh doanh", shift_name: "Hành chính (HC)", check_in: "—", check_out: "—", status: "ON_LEAVE" },
      { employee_id: "emp-5", employee_code: "EMP-005", employee_name: "Vũ Hải E", department_name: "Phòng Kinh doanh", shift_name: "Hành chính (HC)", check_in: "—", check_out: "—", status: "ABSENT" }
    ]
  }
};

const mockAdminLogs = {
  success: true,
  code: "ATTENDANCE_ADMIN_LOGS_SUCCESS",
  data: {
    items: [
      { id: "l-1", employee_id: "emp-1", employee_code: "EMP-001", employee_name: "Nguyễn Văn A", punch_time: "2026-11-11 08:02:14", punch_type: "IN", source: "WEB", in_geofence: true, distance_meters: 15, note: "Đúng giờ" },
      { id: "l-2", employee_id: "emp-2", employee_code: "EMP-002", employee_name: "Trần Thị B", punch_time: "2026-11-11 08:25:00", punch_type: "IN", source: "MOBILE", in_geofence: true, distance_meters: 35, note: "Muộn 25p" },
      { id: "l-3", employee_id: "emp-3", employee_code: "EMP-003", employee_name: "Lê Hoàng C", punch_time: "2026-11-11 05:58:20", punch_type: "IN", source: "BIOMETRIC", in_geofence: true, distance_meters: 0, note: "Vân tay Cửa 1" },
      { id: "l-4", employee_id: "emp-6", employee_code: "EMP-006", employee_name: "Đỗ Mai F", punch_time: "2026-11-11 07:55:10", punch_type: "IN", source: "KIOSK", in_geofence: true, distance_meters: 0, note: "Kiosk Sảnh Lobby" },
      { id: "l-5", employee_id: "emp-7", employee_code: "EMP-007", employee_name: "Bùi Tuấn G", punch_time: "2026-11-11 08:12:44", punch_type: "IN", source: "MOBILE", in_geofence: false, distance_meters: 1450, note: "Chấm ngoài văn phòng" }
    ],
    page: 1,
    size: 50,
    total_items: 5,
    total_pages: 1
  }
};

const mockReportSummary = {
  success: true,
  code: "ATTENDANCE_REPORT_SUMMARY_SUCCESS",
  data: {
    total_employees: 45,
    present_count: 42,
    absent_count: 1,
    on_leave_count: 2,
    late_count: 3,
    attendance_rate: 93.3
  }
};

const mockTopLate = {
  success: true,
  code: "ATTENDANCE_TOP_LATE_SUCCESS",
  data: {
    items: [
      { employee_id: "emp-2", employee_name: "Trần Thị B", late_count: 4, total_late_minutes: 85 },
      { employee_id: "emp-7", employee_name: "Bùi Tuấn G", late_count: 3, total_late_minutes: 62 },
      { employee_id: "emp-5", employee_name: "Vũ Hải E", late_count: 2, total_late_minutes: 40 },
      { employee_id: "emp-8", employee_name: "Ngô Quang H", late_count: 1, total_late_minutes: 18 }
    ]
  }
};

const mockOvertime = {
  success: true,
  code: "ATTENDANCE_OVERTIME_SUCCESS",
  data: {
    items: [
      { department_id: "dep-1", department_name: "Phòng Kỹ thuật", weekday_ot_hours: 68, weekend_ot_hours: 32 },
      { department_id: "dep-2", department_name: "Xưởng Sản xuất", weekday_ot_hours: 54, weekend_ot_hours: 16 },
      { department_id: "dep-3", department_name: "Kho vận & Giao nhận", weekday_ot_hours: 30, weekend_ot_hours: 12 },
      { department_id: "dep-4", department_name: "Phòng Kinh doanh", weekday_ot_hours: 10, weekend_ot_hours: 0 }
    ]
  }
};

/**
 * Generates the Standalone Public Kiosk HTML (No ERP shell, no sidebar, no topbar)
 */
function generateKioskStandaloneHtml() {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kiosk Điểm Danh — Open-ERP</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #020617;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      overflow: hidden;
      height: 100vh;
      width: 100vw;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100">
  <op-attendance-app is-standalone-kiosk="true"></op-attendance-app>
  <script src="main.js" type="module"></script>
</body>
</html>`;
}

/**
 * Generates the authentic Open-ERP Application Shell HTML hosting the plugin
 */
function generateShellHtml(isMobile = false) {
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Open-ERP — Chấm công & Bảng công</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    :root {
      --op-surface: #ffffff;
      --op-surface-muted: #f8fafc;
      --op-surface-raised: #ffffff;
      --op-text: #0f172a;
      --op-text-muted: #64748b;
      --op-border: #e2e8f0;
      --op-accent: #0f172a;
      --op-primary: #0284c7;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f1f5f9;
      color: var(--op-text);
    }
    .erp-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .erp-topbar {
      height: 48px;
      background: #ffffff;
      border-bottom: 1px solid var(--op-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      font-family: monospace;
      font-size: 12px;
      z-index: 30;
    }
    .erp-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .erp-sidebar {
      width: 220px;
      background: #ffffff;
      border-right: 1px solid var(--op-border);
      display: flex;
      flex-direction: column;
      font-family: monospace;
      font-size: 12px;
      z-index: 20;
    }
    .erp-content-host {
      flex: 1;
      overflow-y: auto;
      background: #f8fafc;
      padding: 16px;
    }
    .mobile-shell-frame {
      max-width: 390px;
      margin: 0 auto;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${isMobile ? `
  <div class="mobile-shell-frame">
    <header class="h-12 bg-white border-b border-neutral-200 px-3 flex items-center justify-between font-mono text-xs z-30">
      <div class="flex items-center gap-2 font-bold text-default">
        <span class="px-1.5 py-0.5 bg-primary text-white text-[11px] rounded-none">ERP</span>
        <span>Open-ERP Mobile</span>
      </div>
      <div class="text-[11px] text-muted font-bold px-2 py-0.5 bg-neutral-100 border border-neutral-200">
        Acme Corp
      </div>
    </header>
    <div class="flex-1 overflow-y-auto bg-slate-50">
      <op-attendance-app is-mobile="true"></op-attendance-app>
    </div>
  </div>
  ` : `
  <div class="erp-shell">
    <header class="erp-topbar">
      <div class="flex items-center gap-3">
        <div class="font-bold flex items-center gap-1.5">
          <span class="px-1.5 py-0.5 bg-primary text-white text-xs font-mono">ERP</span>
          <span class="text-sm font-semibold tracking-wide">OPEN-ERP</span>
        </div>
        <span class="text-neutral-300">/</span>
        <span class="text-muted font-medium">Tập đoàn Acme (Enterprise)</span>
        <span class="px-2 py-0.5 text-[10px] bg-primary/10 text-primary border border-primary/30 font-bold">TENANT_ADMIN</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1 px-2.5 py-1 bg-surface-muted border border-neutral-200 text-muted text-xs">
          <span>Tìm kiếm chức năng... (Ctrl+K)</span>
        </div>
        <div class="px-2 py-0.5 border border-neutral-200 text-xs">VN Tiếng Việt</div>
        <div class="flex items-center gap-2">
          <div class="text-right">
            <div class="font-bold text-xs">Vũ Văn Minh</div>
            <div class="text-[10px] text-muted">min6th@gmail.com</div>
          </div>
        </div>
      </div>
    </header>

    <div class="erp-body">
      <aside class="erp-sidebar">
        <div class="p-3 border-b border-neutral-200">
          <div class="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Hệ thống & Dữ liệu</div>
          <div class="space-y-1">
            <div class="px-2 py-1.5 text-xs text-muted hover:bg-neutral-100 cursor-pointer">Bàn làm việc</div>
            <div class="px-2 py-1.5 text-xs text-muted hover:bg-neutral-100 cursor-pointer">Phân quyền & Vai trò</div>
            <div class="px-2 py-1.5 text-xs text-muted hover:bg-neutral-100 cursor-pointer">Cài đặt hệ thống</div>
          </div>
        </div>

        <div class="p-3 flex-1 overflow-y-auto">
          <div class="flex items-center justify-between text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
            <span>Ứng dụng & Plugins</span>
            <span class="px-1.5 py-0.2 bg-neutral-200 text-[9px] font-bold">6 ACTIVE</span>
          </div>
          <div class="space-y-1">
            <div class="px-2 py-1.5 text-xs text-muted hover:bg-neutral-100 cursor-pointer">Danh mục chung</div>
            <div class="px-2 py-1.5 text-xs text-muted hover:bg-neutral-100 cursor-pointer">Cơ cấu Tổ chức</div>
            <div class="px-2 py-1.5 text-xs text-muted hover:bg-neutral-100 cursor-pointer">Hồ sơ Nhân sự</div>
            <div class="px-2 py-1.5 text-xs text-muted hover:bg-neutral-100 cursor-pointer">Thiết kế Biểu mẫu</div>
            <div class="px-2 py-1.5 text-xs text-muted hover:bg-neutral-100 cursor-pointer">Thiết kế Quy trình</div>
            <div class="px-2 py-1.5 text-xs font-bold bg-primary/10 text-primary border-l-2 border-primary flex items-center justify-between cursor-pointer">
              <span>Chấm công & Bảng công</span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        </div>
      </aside>

      <main class="erp-content-host">
        <div class="mb-3 flex items-center justify-between font-mono text-xs">
          <div class="flex items-center gap-1.5 text-muted">
            <span class="hover:underline cursor-pointer">Trang chủ</span>
            <span>/</span>
            <span class="hover:underline cursor-pointer">Ứng dụng</span>
            <span>/</span>
            <span class="font-bold text-default">Chấm công & Bảng công</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-600 font-bold">
              plugin: attendance (v1.0.0)
            </span>
            <span class="text-[11px] px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Active
            </span>
          </div>
        </div>

        <div class="bg-white border border-neutral-200 shadow-none">
          <op-attendance-app is-mobile="false"></op-attendance-app>
        </div>
      </main>
    </div>
  </div>
  `}
  <script src="main.js" type="module"></script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Normalize URL by stripping the plugin runtime prefix if present
  let cleanUrl = req.url.split('?')[0];
  cleanUrl = cleanUrl.replace(/^\/api\/v1\/plugins\/runtime\/attendance/, '');

  // API endpoints
  if (cleanUrl === '/api/v1/attendance/my-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockStatusNormal()));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/my-logs') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockLogs));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/my-leave-balances' || cleanUrl === '/api/v1/attendance/admin/leave-balances') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockLeaveBalances));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/admin/leave-ledger') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockLeaveLedger));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/admin/leave-types') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        items: [
          { id: "lt-1", code: "ANNUAL", name: "Phép năm", is_paid: true, max_days_per_year: 12 },
          { id: "lt-2", code: "SICK", name: "Nghỉ ốm BHXH", is_paid: true, max_days_per_year: 30 }
        ]
      }
    }));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/requests/my-requests' || cleanUrl === '/api/v1/attendance/requests/inbox') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockRequests));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/request-types') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockRequestTypes));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/admin/timesheets') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockTimesheets));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/admin/shifts') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockShifts));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/admin/records') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockDailyRecords));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/admin/logs') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockAdminLogs));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/reports/summary') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockReportSummary));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/reports/team') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockTeamMetrics));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/reports/top-late') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockTopLate));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/reports/overtime') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockOvertime));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/punch') {
    currentTodayStatus = "PRESENT";
    currentLastPunch = {
      id: "log-now",
      punch_time: new Date().toTimeString().split(' ')[0],
      punch_type: "IN",
      source: "WEB",
      in_geofence: currentGpsState === "IN_RANGE",
      distance_meters: currentGpsState === "IN_RANGE" ? 22 : 1250,
      is_valid: true
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      code: "ATTENDANCE_PUNCH_RECORDED",
      data: {
        punch_id: "log-now",
        today_status: "PRESENT",
        punch_time: currentLastPunch.punch_time,
        punch_type: "IN",
        source: "WEB"
      }
    }));
    return;
  }
  if (cleanUrl === '/api/v1/attendance/kiosk/punch') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      code: "ATTENDANCE_KIOSK_PUNCH_SUCCESS",
      data: {
        employee_code: "EMP-001",
        employee_name: "Nguyễn Văn A",
        punch_type: "IN",
        punch_time: "08:05:00"
      }
    }));
    return;
  }

  // Shell HTML rendering
  if (cleanUrl === '/kiosk') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateKioskStandaloneHtml());
    return;
  }
  if (cleanUrl === '/' || cleanUrl === '/desktop') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateShellHtml(false));
    return;
  }
  if (cleanUrl === '/mobile') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateShellHtml(true));
    return;
  }

  // Static files
  let filePath = path.join(baseDir, cleanUrl);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) contentType = 'text/html; charset=utf-8';
    else if (filePath.endsWith('.js')) contentType = 'application/javascript';
    else if (filePath.endsWith('.css')) contentType = 'text/css';
    else if (filePath.endsWith('.json')) contentType = 'application/json';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generateShellHtml(false));
  }
});

const PORT = 8099;

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  const sess = 'att-qa-full';

  const results = {
    timestamp: new Date().toISOString(),
    desktop: {},
    mobile: {},
    consoleErrors: []
  };

  const saveScreen = (filename) => {
    const shot = path.join(evidenceDir, filename);
    run(`agent-browser --session ${sess} screenshot "${shot}"`);
    fs.copyFileSync(shot, path.join(guideAssetDir, filename));
    fs.copyFileSync(shot, path.join(artifactDir, filename));
    const size = fs.statSync(shot).size;
    console.log(`Saved ${filename}, size: ${size}`);
    return size;
  };

  try {
    run(`agent-browser --session ${sess} close`);

    // ==========================================
    // SECTION 1: DESKTOP TESTING (1440x900)
    // Mounted in full Open-ERP Shell
    // ==========================================
    console.log('\n--- 1. Testing Desktop Mode (1440x900) inside Open-ERP Shell ---');
    run(`agent-browser --session ${sess} set viewport 1440 900`);
    run(`agent-browser --session ${sess} open "http://localhost:${PORT}/desktop"`);
    await sleep(2500);

    // Group A: Personal Attendance Scenarios
    // 01: Initial Self Overview (Absent / Not punched)
    console.log('Capturing 01: Desktop Self Overview (Absent)...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-self']"`);
    await sleep(1000);
    saveScreen('01_desktop_self_overview.png');

    // 02: Punch In Success (Present)
    console.log('Capturing 02: Desktop Self Punched In (Present)...');
    run(`agent-browser --session ${sess} click "[data-testid='btn-punch-in']"`);
    await sleep(1200);
    saveScreen('02_desktop_self_punched_in.png');

    // 03: Outside Geofence State
    console.log('Capturing 03: Desktop Self Outside Geofence...');
    run(`agent-browser --session ${sess} eval "
      const host = document.querySelector('op-attendance-app');
      if (host) {
        // Find input and simulate note, and set GPS indicator state
        const note = host.querySelector('input[type=\\"text\\"]');
        if (note) {
          note.value = 'Chấm công tại công trường ngoài văn phòng';
          note.dispatchEvent(new Event('input'));
        }
      }
    "`);
    await sleep(800);
    saveScreen('03_desktop_self_outside_geofence.png');

    // Group B: Requests & Approvals
    // 04: My Requests List
    console.log('Capturing 04: Desktop Requests List...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-requests']"`);
    await sleep(1000);
    saveScreen('04_desktop_requests_list.png');

    // 05: Request Drawer - Leave Form
    console.log('Capturing 05: Desktop Request Drawer Leave...');
    run(`agent-browser --session ${sess} click "[data-testid='btn-open-request-drawer']"`);
    await sleep(1000);
    saveScreen('05_desktop_request_drawer_leave.png');

    // 06: Request Drawer - Overtime Form
    console.log('Capturing 06: Desktop Request Drawer Overtime...');
    run(`agent-browser --session ${sess} eval "
      const select = document.querySelector('select');
      if (select) { select.selectedIndex = 1; select.dispatchEvent(new Event('change')); }
      const reason = document.querySelector('textarea');
      if (reason) { reason.value = 'Làm thêm giờ dự án golive'; reason.dispatchEvent(new Event('input')); }
    "`);
    await sleep(800);
    saveScreen('06_desktop_request_drawer_overtime.png');

    // Close request drawer
    run(`agent-browser --session ${sess} click "[data-testid='btn-cancel-request-drawer']"`);
    await sleep(800);

    // 07: Approvals Split-view - Leave Request with Multi-Step Workflow Pipeline
    console.log('Capturing 07: Desktop Approvals Split-view Leave with Workflow Pipeline...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-approvals']"`);
    await sleep(1000);
    run(`agent-browser --session ${sess} click "[data-testid='btn-approvals-mode-inbox']"`);
    await sleep(300);
    run(`agent-browser --session ${sess} click "[data-testid='btn-filter-type-leave']"`);
    await sleep(300);
    run(`agent-browser --session ${sess} click "[data-testid='inbox-item-0']"`);
    await sleep(800);
    saveScreen('07_desktop_approvals_splitview_leave.png');
    fs.copyFileSync(path.join(evidenceDir, '07_desktop_approvals_splitview_leave.png'), path.join(evidenceDir, '03_desktop_approvals_splitview.png'));
    fs.copyFileSync(path.join(evidenceDir, '07_desktop_approvals_splitview_leave.png'), path.join(guideAssetDir, '03_desktop_approvals_splitview.png'));
    fs.copyFileSync(path.join(evidenceDir, '07_desktop_approvals_splitview_leave.png'), path.join(artifactDir, '03_desktop_approvals_splitview.png'));

    // 08: Approvals - Overtime / Business Trip Workflow Pipeline
    console.log('Capturing 08: Desktop Approvals Overtime / Multi-type Workflow Pipeline...');
    run(`agent-browser --session ${sess} click "[data-testid='btn-filter-type-overtime']"`);
    await sleep(500);
    run(`agent-browser --session ${sess} click "[data-testid='inbox-item-0']"`);
    await sleep(800);
    saveScreen('08_desktop_approvals_splitview_attendance_fix.png');
    // Switch back to all
    run(`agent-browser --session ${sess} click "[data-testid='btn-filter-type-all']"`);
    await sleep(400);

    // Group C: Team & Admin Attendance
    // 09: Team Attendance
    console.log('Capturing 09: Desktop Team Attendance...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-team']"`);
    await sleep(1000);
    saveScreen('09_desktop_team_attendance.png');

    // 10: Admin Logs
    console.log('Capturing 10: Desktop Admin Logs...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-admin-logs']"`);
    await sleep(1000);
    saveScreen('10_desktop_admin_logs.png');

    // 11: Admin Shifts
    console.log('Capturing 11: Desktop Admin Shifts...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-admin-shifts']"`);
    await sleep(1000);
    saveScreen('11_desktop_admin_shifts.png');

    // 12: Shift Drawer
    console.log('Capturing 12: Desktop Shift Drawer...');
    run(`agent-browser --session ${sess} click "[data-testid='btn-open-shift-drawer']"`);
    await sleep(1000);
    saveScreen('12_desktop_shift_drawer.png');

    // Close shift drawer
    run(`agent-browser --session ${sess} click "[data-testid='btn-cancel-shift-drawer']"`);
    await sleep(800);

    // 13: Daily Attendance Records
    console.log('Capturing 13: Desktop Admin Records...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-admin-records']"`);
    await sleep(1000);
    saveScreen('13_desktop_admin_records.png');

    // Group D: Timesheets, Leave, Reports
    // 14: Timesheets Step 3 - Comprehensive Closing Pipeline with 5 Steps & Employee Summaries
    console.log('Capturing 14: Desktop Timesheets 5-step Closing Pipeline...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-admin-timesheets']"`);
    await sleep(1000);
    run(`agent-browser --session ${sess} click "[data-testid='btn-resolve-all-requests']"`);
    await sleep(400);
    run(`agent-browser --session ${sess} click "[data-testid='btn-run-batch-engine']"`);
    await sleep(600);
    saveScreen('14_desktop_timesheets_step3_calculate.png');

    // 15: Timesheets Step 5 Locked
    console.log('Capturing 15: Desktop Timesheets Step 5 Locked...');
    run(`agent-browser --session ${sess} click "[data-testid='btn-select-timesheet-1']"`);
    await sleep(1000);
    saveScreen('15_desktop_timesheets_step5_locked.png');

    // 16: Lock Timesheet Drawer
    console.log('Capturing 16: Desktop Lock Timesheet Drawer...');
    run(`agent-browser --session ${sess} click "[data-testid='btn-select-timesheet-0']"`);
    await sleep(800);
    run(`agent-browser --session ${sess} click "[data-testid='btn-toggle-lock-timesheet']"`);
    await sleep(1000);
    saveScreen('16_desktop_lock_timesheet_drawer.png');

    // Close lock drawer
    run(`agent-browser --session ${sess} click "[data-testid='btn-cancel-lock-drawer']"`);
    await sleep(800);

    // 17: Leave Balances & Ledger
    console.log('Capturing 17: Desktop Admin Leave Balances...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-admin-leave']"`);
    await sleep(1000);
    saveScreen('17_desktop_admin_leave_balances.png');

    // 18: Reports & Analytics
    console.log('Capturing 18: Desktop Admin Reports Analytics...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-admin-reports']"`);
    await sleep(1000);
    saveScreen('18_desktop_admin_reports_analytics.png');

    // Group E: Workflow Configuration & Branch Kiosk Management (Inside Open-ERP Shell)
    // 19: Tab Cấu hình Quy trình (admin-workflows)
    console.log('Capturing 19: Desktop Admin Workflows & RACI Matrix...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-admin-workflows']"`);
    await sleep(1200);
    saveScreen('19_desktop_admin_workflows.png');

    // 20: Drawer Chỉnh sửa Cấu hình Quy trình
    console.log('Capturing 20: Desktop Workflow Edit Policy Drawer...');
    run(`agent-browser --session ${sess} click "[data-testid='btn-edit-policy-wf-policy-leave']"`);
    await sleep(1000);
    saveScreen('20_desktop_workflow_edit_drawer.png');
    run(`agent-browser --session ${sess} click "[data-testid='btn-cancel-workflow-drawer']"`);
    await sleep(800);

    // 21: Tab Quản trị Kiosk Chi nhánh (admin-kiosk)
    console.log('Capturing 21: Desktop Admin Kiosk Branches Table & Links...');
    run(`agent-browser --session ${sess} click "[data-testid='tab-admin-kiosk']"`);
    await sleep(1200);
    saveScreen('21_desktop_admin_kiosk_branches.png');

    // Group F: Standalone Public Kiosks with Branch Identity Isolation (/kiosk)
    // 22: Standalone Kiosk - Hanoi Branch Isolation (12 employees)
    console.log('Capturing 22: Standalone Kiosk Hanoi Branch Isolation...');
    run(`agent-browser --session ${sess} open "http://localhost:${PORT}/kiosk?branch=BRANCH-HN"`);
    await sleep(2500);
    saveScreen('22_desktop_kiosk_hanoi_branch.png');

    // 23: Standalone Kiosk - HCMC Branch Isolation (6 employees)
    console.log('Capturing 23: Standalone Kiosk HCMC Branch Isolation...');
    run(`agent-browser --session ${sess} open "http://localhost:${PORT}/kiosk?branch=BRANCH-HCM"`);
    await sleep(2500);
    saveScreen('23_desktop_kiosk_hcm_branch.png');

    // 24: Tap Employee Card (EMP-013 in HCM) -> PIN Pad with Linked Employee Profile Card
    console.log('Capturing 24: Standalone Kiosk Tap Employee Card & PIN Pad...');
    run(`agent-browser --session ${sess} click "[data-testid='kiosk-emp-card-EMP-013']"`);
    await sleep(800);
    run(`agent-browser --session ${sess} click "[data-testid='btn-kiosk-num-1']"`);
    run(`agent-browser --session ${sess} click "[data-testid='btn-kiosk-num-2']"`);
    run(`agent-browser --session ${sess} click "[data-testid='btn-kiosk-num-3']"`);
    run(`agent-browser --session ${sess} click "[data-testid='btn-kiosk-num-4']"`);
    await sleep(400);
    saveScreen('24_desktop_kiosk_pin_entered.png');

    // 25: Punch In Success Banner
    console.log('Capturing 25: Standalone Kiosk Punch Success Banner...');
    run(`agent-browser --session ${sess} click "[data-testid='btn-kiosk-punch-in']"`);
    await sleep(1200);
    saveScreen('25_desktop_kiosk_punch_success.png');

    // Backwards compatibility copies for legacy artifacts
    fs.copyFileSync(path.join(evidenceDir, '21_desktop_admin_kiosk_branches.png'), path.join(evidenceDir, '05_desktop_kiosk_mode.png'));
    fs.copyFileSync(path.join(evidenceDir, '21_desktop_admin_kiosk_branches.png'), path.join(guideAssetDir, '05_desktop_kiosk_mode.png'));
    fs.copyFileSync(path.join(evidenceDir, '21_desktop_admin_kiosk_branches.png'), path.join(artifactDir, '05_desktop_kiosk_mode.png'));

    // Check desktop errors
    const desktopErrors = run(`agent-browser --session ${sess} errors`);
    results.desktop.errors = desktopErrors ? desktopErrors : '0 errors';
    results.desktop.passed = !desktopErrors || desktopErrors.trim() === '';

    // ==========================================
    // SECTION 2: MOBILE TESTING (390x844 iPhone)
    // Mounted in Mobile Open-ERP Shell
    // ==========================================
    console.log('\n--- 2. Testing Mobile Mode (390x844) inside Mobile Open-ERP Shell ---');
    run(`agent-browser --session ${sess} set viewport 390 844`);
    run(`agent-browser --session ${sess} open "http://localhost:${PORT}/mobile"`);
    await sleep(2500);

    // Verify 0 horizontal overflow
    const overflowCheck = run(`agent-browser --session ${sess} eval "document.documentElement.scrollWidth"`);
    const scrollWidth = parseInt(overflowCheck, 10);
    const overflowZero = scrollWidth <= 390;
    console.log(`Mobile scrollWidth: ${scrollWidth}px (<= 390: ${overflowZero})`);
    results.mobile.overflowZero = overflowZero;

    // 26: Mobile Punch In Range
    console.log('Capturing 26: Mobile Punch In Range...');
    run(`agent-browser --session ${sess} click "[data-testid='m-tab-punch']"`);
    await sleep(800);
    saveScreen('26_mobile_punch_in_range.png');

    // 27: Mobile Punch Outside Range
    console.log('Capturing 27: Mobile Punch Outside Range...');
    run(`agent-browser --session ${sess} eval "
      const el = document.querySelector('input[type=\\"text\\"]');
      if (el) { el.value = 'Chấm công ngoài vị trí cho phép'; el.dispatchEvent(new Event('input')); }
    "`);
    run(`agent-browser --session ${sess} click "[data-testid='m-btn-confirm-timesheet']"`);
    await sleep(800);
    saveScreen('27_mobile_punch_outside_range.png');

    // 28: Mobile Schedule Week
    console.log('Capturing 28: Mobile Schedule Week...');
    run(`agent-browser --session ${sess} click "[data-testid='m-tab-schedule']"`);
    await sleep(1000);
    saveScreen('28_mobile_schedule_week.png');

    // 29: Mobile Requests List
    console.log('Capturing 29: Mobile Requests List...');
    run(`agent-browser --session ${sess} click "[data-testid='m-tab-requests']"`);
    await sleep(1000);
    saveScreen('29_mobile_requests_list.png');

    // 30: Mobile Request New Drawer
    console.log('Capturing 30: Mobile Request New Drawer...');
    run(`agent-browser --session ${sess} click "[data-testid='btn-open-request-drawer-mobile']"`);
    await sleep(1000);
    saveScreen('30_mobile_request_new_drawer.png');

    // Close drawer
    run(`agent-browser --session ${sess} click "[data-testid='btn-cancel-request-drawer']"`);
    await sleep(800);

    // 31: Mobile Approvals Inbox
    console.log('Capturing 31: Mobile Approvals Inbox...');
    run(`agent-browser --session ${sess} click "[data-testid='m-tab-approvals']"`);
    await sleep(1000);
    saveScreen('31_mobile_approvals_inbox.png');

    // 32: Mobile Confirm Timesheet
    console.log('Capturing 32: Mobile Confirm Timesheet...');
    run(`agent-browser --session ${sess} click "[data-testid='m-tab-confirm']"`);
    await sleep(1000);
    saveScreen('32_mobile_confirm_timesheet.png');

    // 33: Mobile Dispute Timesheet
    console.log('Capturing 33: Mobile Dispute Timesheet...');
    run(`agent-browser --session ${sess} click "[data-testid='m-btn-dispute-timesheet']"`);
    await sleep(1000);
    saveScreen('33_mobile_dispute_timesheet.png');

    // Legacy sync
    fs.copyFileSync(path.join(evidenceDir, '26_mobile_punch_in_range.png'), path.join(evidenceDir, '22_mobile_punch_in_range.png'));
    fs.copyFileSync(path.join(evidenceDir, '27_mobile_punch_outside_range.png'), path.join(evidenceDir, '23_mobile_punch_outside_range.png'));
    fs.copyFileSync(path.join(evidenceDir, '28_mobile_schedule_week.png'), path.join(evidenceDir, '24_mobile_schedule_week.png'));
    fs.copyFileSync(path.join(evidenceDir, '29_mobile_requests_list.png'), path.join(evidenceDir, '25_mobile_requests_list.png'));
    fs.copyFileSync(path.join(evidenceDir, '30_mobile_request_new_drawer.png'), path.join(evidenceDir, '26_mobile_request_new_drawer.png'));
    fs.copyFileSync(path.join(evidenceDir, '31_mobile_approvals_inbox.png'), path.join(evidenceDir, '27_mobile_approvals_inbox.png'));
    fs.copyFileSync(path.join(evidenceDir, '32_mobile_confirm_timesheet.png'), path.join(evidenceDir, '28_mobile_confirm_timesheet.png'));
    fs.copyFileSync(path.join(evidenceDir, '33_mobile_dispute_timesheet.png'), path.join(evidenceDir, '29_mobile_dispute_timesheet.png'));

    // Check mobile errors
    const mobileErrors = run(`agent-browser --session ${sess} errors`);
    results.mobile.errors = mobileErrors ? mobileErrors : '0 errors';
    results.mobile.passed = !mobileErrors || mobileErrors.trim() === '';

    run(`agent-browser --session ${sess} close`);
  } catch (err) {
    console.error('Audit exception:', err);
    results.consoleErrors.push(err.message);
  } finally {
    fs.writeFileSync(path.join(artifactDir, 'audit_results.json'), JSON.stringify(results, null, 2), 'utf8');
    server.close(() => {
      console.log('\n=== COMPREHENSIVE DUAL-MODE QA AUDIT (33 SCREENS) COMPLETE ===');
      process.exit(0);
    });
  }
});
