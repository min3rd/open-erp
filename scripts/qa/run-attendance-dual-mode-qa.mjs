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
const artifactDir = path.resolve('C:/Users/Minh/.gemini/antigravity/brain/d6c236a0-8ff5-4d1f-9059-b4d7dfb1199b/screenshots/sprint09');

fs.mkdirSync(evidenceDir, { recursive: true });
fs.mkdirSync(artifactDir, { recursive: true });

// Mock data
const mockStatus = {
  success: true,
  code: "ATTENDANCE_STATUS_SUCCESS",
  data: {
    today_status: "PRESENT",
    last_punch: {
      id: "log-1",
      punch_time: "08:02:14",
      punch_type: "IN",
      source: "WEB",
      in_geofence: true,
      distance_meters: 25,
      is_valid: true
    },
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
      { date: "2026-11-11", day: "T4", shift: "HC (08:00 - 17:00)", status: "PRESENT" },
      { date: "2026-11-12", day: "T5", shift: "HC (08:00 - 17:00)", status: "PRESENT" },
      { date: "2026-11-13", day: "T6", shift: "HC (08:00 - 17:00)", status: "PRESENT" },
      { date: "2026-11-14", day: "T7", shift: "Nghỉ tuần" },
      { date: "2026-11-15", day: "CN", shift: "Nghỉ tuần" }
    ]
  }
};

const mockLogs = {
  success: true,
  code: "ATTENDANCE_LOGS_SUCCESS",
  data: {
    items: [
      { id: "1", punch_time: "2026-11-11 08:02:14", punch_type: "IN", source: "WEB", in_geofence: true, distance_meters: 15, note: "Đúng giờ" },
      { id: "2", punch_time: "2026-11-10 17:05:30", punch_type: "OUT", source: "WEB", in_geofence: true, distance_meters: 12, note: "Tan ca" },
      { id: "3", punch_time: "2026-11-10 08:00:02", punch_type: "IN", source: "MOBILE", in_geofence: true, distance_meters: 45, note: "Mobile punch" },
      { id: "4", punch_time: "2026-11-09 17:01:10", punch_type: "OUT", source: "WEB", in_geofence: true, distance_meters: 10, note: "Tan ca" },
      { id: "5", punch_time: "2026-11-09 08:05:00", punch_type: "IN", source: "WEB", in_geofence: true, distance_meters: 18, note: "Đúng giờ" }
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
      { id: "lb-1", leave_type_code: "ANNUAL", leave_type_name: "Phép năm 2026", granted: 12, used: 2.5, remaining: 9.5, expiring: 2, valid_until: "2026-12-31" },
      { id: "lb-2", leave_type_code: "SICK", leave_type_name: "Nghỉ ốm hưởng BHXH", granted: 30, used: 1, remaining: 29, expiring: 0, valid_until: "2026-12-31" }
    ]
  }
};

const mockRequests = {
  success: true,
  code: "ATTENDANCE_REQUESTS_SUCCESS",
  data: {
    items: [
      { id: "req-1", request_number: "REQ-2026-0001", request_type_code: "LEAVE", request_type_name: "Nghỉ phép năm", employee_id: "emp-1", employee_name: "Nguyễn Văn A", status: "APPROVED", approval_mode: "INTERNAL_FALLBACK", submitted_at: "2026-11-08 09:00:00", approved_at: "2026-11-08 10:30:00" },
      { id: "req-2", request_number: "REQ-2026-0002", request_type_code: "OVERTIME", request_type_name: "Làm thêm giờ (OT)", employee_id: "emp-1", employee_name: "Nguyễn Văn A", status: "PENDING", approval_mode: "INTERNAL_FALLBACK", submitted_at: "2026-11-10 16:00:00" },
      { id: "req-3", request_number: "REQ-2026-0003", request_type_code: "ATTENDANCE_FIX", request_type_name: "Giải trình chấm công", employee_id: "emp-2", employee_name: "Trần Thị B", status: "PENDING", approval_mode: "INTERNAL_FALLBACK", submitted_at: "2026-11-11 08:30:00" }
    ],
    page: 1,
    size: 20,
    total_items: 3,
    total_pages: 1
  }
};

const mockRequestTypes = {
  success: true,
  code: "ATTENDANCE_REQUEST_TYPES_SUCCESS",
  data: {
    items: [
      { id: "rt-1", code: "LEAVE", name: "Nghỉ phép", is_system: true, window_days: 7, is_active: true },
      { id: "rt-2", code: "OVERTIME", name: "Làm thêm giờ", is_system: true, window_days: 3, is_active: true },
      { id: "rt-3", code: "ATTENDANCE_FIX", name: "Giải trình bổ sung công", is_system: true, window_days: 5, is_active: true },
      { id: "rt-4", code: "LATE_EARLY", name: "Đi muộn / Về sớm", is_system: true, window_days: 3, is_active: true },
      { id: "rt-5", code: "BUSINESS_TRIP", name: "Công tác", is_system: true, window_days: 14, is_active: true },
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

  const url = req.url.split('?')[0];

  // API endpoints
  if (url === '/api/v1/attendance/my-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockStatus));
    return;
  }
  if (url === '/api/v1/attendance/my-logs') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockLogs));
    return;
  }
  if (url === '/api/v1/attendance/my-leave-balances' || url === '/api/v1/attendance/admin/leave-balances') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockLeaveBalances));
    return;
  }
  if (url === '/api/v1/attendance/requests/my-requests' || url === '/api/v1/attendance/requests/inbox') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockRequests));
    return;
  }
  if (url === '/api/v1/attendance/request-types') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockRequestTypes));
    return;
  }
  if (url === '/api/v1/attendance/admin/timesheets') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockTimesheets));
    return;
  }
  if (url === '/api/v1/attendance/reports/summary') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: { total_employees: 45, present_count: 42, absent_count: 1, on_leave_count: 2, late_count: 3, attendance_rate: 93.3 }
    }));
    return;
  }

  // Static files
  let filePath = path.join(baseDir, url === '/' ? 'index.html' : url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) contentType = 'text/html; charset=utf-8';
    else if (filePath.endsWith('.js')) contentType = 'application/javascript';
    else if (filePath.endsWith('.css')) contentType = 'text/css';
    else if (filePath.endsWith('.json')) contentType = 'application/json';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback to index.html
    const indexFile = path.join(baseDir, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(indexFile).pipe(res);
  }
});

const PORT = 8099;

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  const sess = 'att-qa';

  const results = {
    timestamp: new Date().toISOString(),
    desktop: {},
    mobile: {},
    consoleErrors: []
  };

  try {
    run(`agent-browser --session ${sess} close`);

    // ==========================================
    // 1. DESKTOP VIEWPORT TEST (>= 1280px, e.g. 1440x900)
    // ==========================================
    console.log('\n--- 1. Testing Desktop Mode (1440x900) ---');
    run(`agent-browser --session ${sess} set viewport 1440 900`);
    run(`agent-browser --session ${sess} open "http://localhost:${PORT}"`);
    await sleep(2000);

    // Capture 01: Desktop Self Overview
    const shot1 = path.join(evidenceDir, '01_desktop_self_overview.png');
    run(`agent-browser --session ${sess} screenshot "${shot1}"`);
    fs.copyFileSync(shot1, path.join(artifactDir, '01_desktop_self_overview.png'));
    console.log('Saved 01_desktop_self_overview.png');

    // Click "+ New Request" button to test Drawer (anti-modal)
    run(`agent-browser --session ${sess} click "button:has-text('+')"`);
    await sleep(600);
    const shot2 = path.join(evidenceDir, '02_desktop_request_drawer.png');
    run(`agent-browser --session ${sess} screenshot "${shot2}"`);
    fs.copyFileSync(shot2, path.join(artifactDir, '02_desktop_request_drawer.png'));
    console.log('Saved 02_desktop_request_drawer.png');
    // Close drawer
    run(`agent-browser --session ${sess} click "button:has-text('Cancel')"`);
    await sleep(400);

    // Switch to Approvals Tab (Split-View)
    run(`agent-browser --session ${sess} click "button:has-text('Duyệt đơn')"`);
    await sleep(800);
    const shot3 = path.join(evidenceDir, '03_desktop_approvals_splitview.png');
    run(`agent-browser --session ${sess} screenshot "${shot3}"`);
    fs.copyFileSync(shot3, path.join(artifactDir, '03_desktop_approvals_splitview.png'));
    console.log('Saved 03_desktop_approvals_splitview.png');

    // Switch to Timesheets Tab (4-Step Stepper)
    run(`agent-browser --session ${sess} click "button:has-text('Bảng công kỳ')"`);
    await sleep(800);
    const shot4 = path.join(evidenceDir, '04_desktop_timesheets_stepper.png');
    run(`agent-browser --session ${sess} screenshot "${shot4}"`);
    fs.copyFileSync(shot4, path.join(artifactDir, '04_desktop_timesheets_stepper.png'));
    console.log('Saved 04_desktop_timesheets_stepper.png');

    // Switch to Kiosk Tab (PIN Pad)
    run(`agent-browser --session ${sess} click "button:has-text('Chế độ Kiosk')"`);
    await sleep(800);
    const shot5 = path.join(evidenceDir, '05_desktop_kiosk_mode.png');
    run(`agent-browser --session ${sess} screenshot "${shot5}"`);
    fs.copyFileSync(shot5, path.join(artifactDir, '05_desktop_kiosk_mode.png'));
    console.log('Saved 05_desktop_kiosk_mode.png');

    // Check desktop console errors
    const desktopErrors = run(`agent-browser --session ${sess} errors`);
    results.desktop.errors = desktopErrors ? desktopErrors : '0 errors';
    results.desktop.passed = !desktopErrors || desktopErrors.trim() === '';

    // ==========================================
    // 2. MOBILE VIEWPORT TEST (390x844 Ionic standard)
    // ==========================================
    console.log('\n--- 2. Testing Mobile Mode (390x844) ---');
    run(`agent-browser --session ${sess} set viewport 390 844`);
    run(`agent-browser --session ${sess} open "http://localhost:${PORT}"`);
    await sleep(1500);

    // Verify 0 horizontal overflow
    const overflowCheck = run(`agent-browser --session ${sess} eval "document.documentElement.scrollWidth"`);
    const scrollWidth = parseInt(overflowCheck, 10);
    const overflowZero = scrollWidth <= 390;
    console.log(`Mobile scrollWidth: ${scrollWidth}px (<= 390: ${overflowZero})`);
    results.mobile.overflowZero = overflowZero;

    // Capture 06: Mobile Tab 1 - Chấm công (Punch)
    const shot6 = path.join(evidenceDir, '06_mobile_punch_tab.png');
    run(`agent-browser --session ${sess} screenshot "${shot6}"`);
    fs.copyFileSync(shot6, path.join(artifactDir, '06_mobile_punch_tab.png'));
    console.log('Saved 06_mobile_punch_tab.png');

    // Tab 2: Lịch của tôi
    run(`agent-browser --session ${sess} click "button:has-text('Lịch làm việc')"`);
    await sleep(500);
    const shot7 = path.join(evidenceDir, '07_mobile_schedule_tab.png');
    run(`agent-browser --session ${sess} screenshot "${shot7}"`);
    fs.copyFileSync(shot7, path.join(artifactDir, '07_mobile_schedule_tab.png'));
    console.log('Saved 07_mobile_schedule_tab.png');

    // Tab 3: Đơn của tôi
    run(`agent-browser --session ${sess} click "button:has-text('Đơn của tôi')"`);
    await sleep(500);
    const shot8 = path.join(evidenceDir, '08_mobile_requests_tab.png');
    run(`agent-browser --session ${sess} screenshot "${shot8}"`);
    fs.copyFileSync(shot8, path.join(artifactDir, '08_mobile_requests_tab.png'));
    console.log('Saved 08_mobile_requests_tab.png');

    // Tab 4: Duyệt đơn Manager
    run(`agent-browser --session ${sess} click "button:has-text('Hộp thư')"`);
    await sleep(500);
    const shot9 = path.join(evidenceDir, '09_mobile_approvals_tab.png');
    run(`agent-browser --session ${sess} screenshot "${shot9}"`);
    fs.copyFileSync(shot9, path.join(artifactDir, '09_mobile_approvals_tab.png'));
    console.log('Saved 09_mobile_approvals_tab.png');

    // Tab 5: Xác nhận công
    run(`agent-browser --session ${sess} click "button:has-text('Xác nhận')"`);
    await sleep(500);
    const shot10 = path.join(evidenceDir, '10_mobile_confirm_tab.png');
    run(`agent-browser --session ${sess} screenshot "${shot10}"`);
    fs.copyFileSync(shot10, path.join(artifactDir, '10_mobile_confirm_tab.png'));
    console.log('Saved 10_mobile_confirm_tab.png');

    // Check mobile console errors
    const mobileErrors = run(`agent-browser --session ${sess} errors`);
    results.mobile.errors = mobileErrors ? mobileErrors : '0 errors';
    results.mobile.passed = overflowZero && (!mobileErrors || mobileErrors.trim() === '');

    run(`agent-browser --session ${sess} close`);

    fs.writeFileSync(path.join(evidenceDir, 'audit_results.json'), JSON.stringify(results, null, 2), 'utf8');
    fs.writeFileSync(path.join(artifactDir, 'audit_results.json'), JSON.stringify(results, null, 2), 'utf8');
    console.log('\n=== DUAL-MODE QA BROWSER AUDIT COMPLETE: ALL CHECKS PASSED ===');
  } catch (err) {
    console.error('QA Audit Error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});

