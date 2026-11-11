import fs from 'node:fs';

const filePath = 'plugins/attendance/web/src/app/attendance-screen.component.html';
let html = fs.readFileSync(filePath, 'utf8');

// 1. Update Standalone Public Kiosk Header (lines 1-35)
const oldKioskHeader = `<header class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div class="flex items-center gap-3">
        <div class="px-3 py-1.5 bg-primary text-white font-bold text-sm tracking-wider">
          ACME KIOSK
        </div>
        <div>
          <h1 class="text-base font-bold text-white tracking-wide uppercase">
            {{ 'attendance.kiosk.public_banner' | translate }}
          </h1>
          <p class="text-xs text-slate-400">
            Sảnh Lễ tân Tòa A · KIOSK-LOBBY-01
          </p>
        </div>
      </div>

      <div class="flex items-center gap-6">
        <div class="text-right">
          <div class="text-2xl font-black tracking-widest text-emerald-400 font-mono">
            {{ currentTimeString() }}
          </div>
          <div class="text-xs text-slate-400">
            {{ currentDateString() }}
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-bold">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{{ 'attendance.kiosk.system_status_online' | translate }}</span>
        </div>
      </div>
    </header>`;

const newKioskHeader = `<header class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
      <div class="flex items-center gap-3.5">
        <div class="px-3 py-1.5 bg-emerald-600 text-white font-mono font-black text-sm tracking-widest uppercase shadow-md">
          ACME KIOSK
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base font-bold text-white tracking-wide uppercase">
              {{ 'attendance.kiosk.public_banner' | translate }} — {{ currentKioskBranch().name }}
            </h1>
            <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
              {{ 'attendance.kiosk.branch_isolation_banner' | translate }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ currentKioskBranch().location }} · Mã máy: <span class="font-mono text-emerald-400 font-bold">{{ currentKioskBranch().device }}</span> · {{ 'attendance.kiosk.branch_notice' | translate }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-6">
        <div class="text-right">
          <div class="text-2xl font-black tracking-widest text-emerald-400 font-mono">
            {{ currentTimeString() }}
          </div>
          <div class="text-xs text-slate-400">
            {{ currentDateString() }}
          </div>
        </div>

        <div class="flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-bold">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{{ 'attendance.kiosk.system_status_online' | translate }}</span>
        </div>
      </div>
    </header>`;

html = html.replace(oldKioskHeader, newKioskHeader);

// 2. Replace the old main ERP container start
const oldErpStart = `} @else {
<div class="op-attendance-container w-full min-h-screen bg-surface text-default flex flex-col font-sans">
  <!-- Notifications Banner -->`;

const newErpStart = `} @else {
<section class="flex min-h-full flex-col bg-surface-muted text-xs text-ink font-sans">
  <!-- Toast Floating Notification -->
  @if (toastMessage()) {
    <div class="fixed top-4 right-4 z-50 flex items-center gap-2 border border-emerald-500 bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-fade-in">
      <app-icon name="check" size="sm" [decorative]="true" />
      <span>{{ toastMessage() }}</span>
    </div>
  }
  <!-- Notifications Banner -->`;

html = html.replace(oldErpStart, newErpStart);

// 3. Replace the Desktop Header & Tab Bar (around lines 744-880)
const oldDesktopHeaderRegex = /<!-- Desktop View -->\s*@if \(!isMobile\(\)\) \{\s*<div class="flex-1 flex flex-col">\s*<!-- Desktop Header & Tab Bar -->[\s\S]*?<!-- Main Content Area -->\s*<div class="flex-1 p-4 overflow-y-auto">/;

const newDesktopHeader = `<!-- Desktop View -->
  @if (!isMobile()) {
    <div class="flex-1 flex flex-col">
      <!-- WORKSPACE HEADER (Consistent with employee & workflow plugins!) -->
      <header class="border-b border-default bg-surface px-4 py-4 sm:px-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <app-icon name="grid" size="sm" [decorative]="true" />
              <span>{{ 'PLUGIN_ATTENDANCE_WORKSPACE' | translate }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <h1 class="mt-1 text-lg font-semibold tracking-tight text-ink">{{ 'PLUGIN_ATTENDANCE_TITLE' | translate }}</h1>
              <span class="inline-flex cursor-help text-muted hover:text-ink" [title]="'PLUGIN_ATTENDANCE_SUBTITLE' | translate">
                <app-icon name="help-circle" size="xs" [decorative]="true" />
              </span>
            </div>
            <p class="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{{ 'PLUGIN_ATTENDANCE_SUBTITLE' | translate }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <app-sharp-button size="sm" shape="sharp" (clicked)="openCreateRequestDrawer()">
              <span class="inline-flex items-center gap-1"><app-icon name="plus" size="sm" [decorative]="true" />{{ 'attendance.request.create_btn' | translate }}</span>
            </app-sharp-button>
            <app-sharp-button variant="outline" size="sm" shape="sharp" (clicked)="exportTimesheets()">
              <span class="inline-flex items-center gap-1"><app-icon name="download" size="sm" [decorative]="true" />{{ 'attendance.reports.export_csv' | translate }}</span>
            </app-sharp-button>
            <app-sharp-button variant="ghost" size="sm" shape="sharp" (clicked)="loadInitialData()">
              <span class="inline-flex items-center gap-1"><app-icon name="refresh-cw" size="sm" [decorative]="true" />{{ 'COMMON_REFRESH' | translate }}</span>
            </app-sharp-button>
          </div>
        </div>

        <!-- 4-Card KPI Summary Bar -->
        <div class="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
          <div class="border border-default bg-surface p-3">
            <div class="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <span>{{ 'attendance.kpi.today_status' | translate }}</span>
              <app-icon name="user" size="sm" [decorative]="true" />
            </div>
            <div class="mt-1 flex items-center justify-between">
              <p class="text-xl font-semibold leading-none text-ink">{{ todayStatus() === 'IN_OFFICE' ? ('attendance.status.IN_OFFICE' | translate) : (todayStatus() === 'OUTSIDE' ? ('attendance.status.OUTSIDE' | translate) : ('attendance.status.NOT_PUNCHED' | translate)) }}</p>
              <app-attendance-status-badge [status]="todayStatus()"></app-attendance-status-badge>
            </div>
          </div>

          <div class="border border-default bg-surface p-3">
            <div class="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <span>{{ 'attendance.kpi.punches_today' | translate }}</span>
              <app-icon name="check" size="sm" [decorative]="true" />
            </div>
            <p class="mt-1 text-xl font-semibold leading-none text-emerald-600 dark:text-emerald-400">{{ todayPunchesCount() }} / {{ allEmployees().length }}</p>
            <p class="mt-1 text-[11px] text-muted">{{ 'attendance.kpi.punches_today_hint' | translate }}</p>
          </div>

          <div class="border border-default bg-surface p-3">
            <div class="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <span>{{ 'attendance.kpi.pending_approvals' | translate }}</span>
              <app-icon name="inbox" size="sm" [decorative]="true" />
            </div>
            <p class="mt-1 text-xl font-semibold leading-none text-amber-600 dark:text-amber-400">{{ inboxRequestsList().length }}</p>
            <p class="mt-1 text-[11px] text-muted">{{ 'attendance.kpi.pending_approvals_hint' | translate }}</p>
          </div>

          <div class="border border-default bg-surface p-3">
            <div class="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <span>{{ 'attendance.kpi.current_period' | translate }}</span>
              <app-icon name="calendar" size="sm" [decorative]="true" />
            </div>
            <p class="mt-1 text-xl font-semibold leading-none text-ink">Tháng 11/2026</p>
            <p class="mt-1 text-[11px] text-muted">{{ selectedTimesheet()?.locked ? ('attendance.timesheet.status_locked' | translate) : ('attendance.timesheet.status_open' | translate) }}</p>
          </div>
        </div>
      </header>

      <!-- NAVIGATION TAB STRIP (Consistent with employee & workflow plugins!) -->
      <nav class="flex gap-1 overflow-x-auto border-b border-default bg-surface px-3 sm:px-5" [attr.aria-label]="'PLUGIN_ATTENDANCE_TITLE' | translate">
        @for (item of screenTabs(); track item.key) {
          <button
            type="button"
            [attr.data-testid]="'tab-' + item.key"
            class="inline-flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-[11px] font-medium transition-colors cursor-pointer"
            [class.border-accent]="activeTab() === item.key"
            [class.text-ink]="activeTab() === item.key"
            [class.font-bold]="activeTab() === item.key"
            [class.border-transparent]="activeTab() !== item.key"
            [class.text-muted]="activeTab() !== item.key"
            [class.hover:text-ink]="activeTab() !== item.key"
            (click)="selectTab(item.key)"
          >
            <app-icon [name]="item.icon" size="sm" [decorative]="true" />
            <span>{{ item.labelKey | translate }}</span>
            @if (item.count !== undefined && item.count > 0) {
              <span class="min-w-5 border border-default bg-surface-muted px-1 text-center text-[10px] font-semibold text-muted">{{ item.count }}</span>
            }
          </button>
        }
      </nav>

      <!-- Main Content Area -->
      <main class="flex-1 p-4 space-y-4 overflow-y-auto">`;

html = html.replace(oldDesktopHeaderRegex, newDesktopHeader);

// 4. Update Tab Kiosk: support both 'kiosk' and 'admin-kiosk' + add Branch Copy Link & Token Rotation
const oldTabKioskCondition = `@if (activeTab() === 'kiosk') {`;
const newTabKioskSection = `@if (activeTab() === 'kiosk' || activeTab() === 'admin-kiosk') {
          <div class="space-y-4 text-xs">
            <!-- Header Toolbar -->
            <div class="p-4 bg-surface border border-default space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-default pb-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-ink">
                      {{ 'attendance.kiosk.admin_title' | translate }}
                    </h3>
                    <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-700 dark:text-emerald-300">
                      {{ 'attendance.kiosk.branch_isolation_banner' | translate }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Quản lý Điểm Chấm công Sảnh và Xuất Đường dẫn Riêng cho từng Chi nhánh. Đảm bảo bảo mật danh tính nhân viên 100% giữa các chi nhánh.
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <app-sharp-button variant="outline" size="sm" shape="sharp" (clicked)="openPublicKiosk()">
                    <span class="inline-flex items-center gap-1"><app-icon name="external-link" size="sm" [decorative]="true" />{{ 'attendance.kiosk.open_public' | translate }}</span>
                  </app-sharp-button>
                </div>
              </div>

              <!-- Metrics Summary Cards -->
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div class="p-3 border border-default bg-surface">
                  <div class="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">{{ 'attendance.kiosk.total_devices' | translate }}</div>
                  <div class="text-xl font-bold text-ink mt-1">{{ kioskDevicesList().length }} máy</div>
                </div>
                <div class="p-3 border border-default bg-surface">
                  <div class="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">Chi nhánh triển khai</div>
                  <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">3 chi nhánh</div>
                </div>
                <div class="p-3 border border-default bg-surface">
                  <div class="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">{{ 'attendance.kiosk.online_devices' | translate }}</div>
                  <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">2 máy trực tuyến</div>
                </div>
                <div class="p-3 border border-default bg-surface">
                  <div class="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">{{ 'attendance.kiosk.today_punches' | translate }}</div>
                  <div class="text-xl font-bold text-ink mt-1">142 lượt</div>
                </div>
              </div>

              <!-- Kiosk Devices by Branch Table -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-xs uppercase text-slate-800 dark:text-slate-200">
                    Danh mục Điểm Chấm công Kiosk theo Chi nhánh & Đường dẫn Chuyên biệt
                  </div>
                  <span class="text-[11px] text-slate-600 dark:text-slate-400 italic">
                    {{ 'attendance.kiosk.branch_notice' | translate }}
                  </span>
                </div>
                <div class="overflow-x-auto border border-default">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase text-[10px] font-bold tracking-wider border-b border-default">
                      <tr>
                        <th class="p-2.5">{{ 'attendance.kiosk.branch_name' | translate }}</th>
                        <th class="p-2.5">Mã thiết bị</th>
                        <th class="p-2.5">{{ 'attendance.kiosk.location' | translate }}</th>
                        <th class="p-2.5">{{ 'attendance.kiosk.ip_address' | translate }}</th>
                        <th class="p-2.5 text-center">Trạng thái</th>
                        <th class="p-2.5">Phạm vi Nhân sự (Bảo mật)</th>
                        <th class="p-2.5 text-center">{{ 'attendance.kiosk.today_punches' | translate }}</th>
                        <th class="p-2.5 text-center">Hành động Phân lập</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-default bg-surface text-ink">
                      @for (dev of kioskDevicesList(); track dev.id) {
                        <tr class="hover:bg-surface-muted transition-colors">
                          <td class="p-2.5">
                            <div class="font-bold text-ink">{{ dev.branch_name }}</div>
                            <div class="text-[10px] font-mono text-muted">{{ dev.branch_code }}</div>
                          </td>
                          <td class="p-2.5 font-mono font-bold text-accent">{{ dev.device_code }}</td>
                          <td class="p-2.5 font-medium text-ink">{{ dev.location_name }}</td>
                          <td class="p-2.5 font-mono text-slate-600 dark:text-slate-400">{{ dev.ip_address }}</td>
                          <td class="p-2.5 text-center">
                            @if (dev.status === 'ONLINE') {
                              <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">ONLINE</span>
                            } @else {
                              <span class="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700">OFFLINE</span>
                            }
                          </td>
                          <td class="p-2.5">
                            <span class="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                              Chỉ nhân viên {{ dev.branch_name }}
                            </span>
                          </td>
                          <td class="p-2.5 text-center font-bold font-mono">{{ dev.today_punches }}</td>
                          <td class="p-2.5 text-center">
                            <div class="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                [attr.data-testid]="'btn-copy-kiosk-' + dev.device_code"
                                (click)="copyBranchKioskLink(dev)"
                                class="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 flex items-center gap-1 cursor-pointer shadow-xs"
                                [title]="'attendance.kiosk.copy_branch_link' | translate"
                              >
                                <svg class="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                <span>{{ 'attendance.kiosk.copy_branch_link' | translate }}</span>
                              </button>

                              <button
                                type="button"
                                [attr.data-testid]="'btn-open-kiosk-' + dev.device_code"
                                (click)="openBranchKiosk(dev)"
                                class="px-2 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 cursor-pointer"
                                [title]="'attendance.kiosk.open_branch_kiosk' | translate"
                              >
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              </button>

                              <button
                                type="button"
                                [attr.data-testid]="'btn-rotate-kiosk-' + dev.device_code"
                                (click)="rotateKioskToken(dev)"
                                class="px-2 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer"
                                [title]="'attendance.kiosk.rotate_token' | translate"
                              >
                                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>`;

html = html.replace(oldTabKioskCondition, newTabKioskSection);

// 5. Add Tab admin-workflows (Cấu hình Quy trình)
const workflowTabMarkup = `        <!-- 10. TAB: APPROVAL WORKFLOWS CONFIGURATION (Cấu hình Luồng Xử lý & RACI Matrix) -->
        @if (activeTab() === 'admin-workflows') {
          <div class="space-y-4 text-xs font-sans">
            <!-- Header Toolbar -->
            <div class="p-4 bg-surface border border-default space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-default pb-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <app-icon name="git-branch" size="sm" [decorative]="true" />
                      <span>{{ 'attendance.workflows.title' | translate }}</span>
                    </h3>
                    <span class="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950/80 dark:border-sky-700 dark:text-sky-300">
                      {{ 'attendance.workflows.configured_by_banner' | translate }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {{ 'attendance.workflows.subtitle' | translate }}
                  </p>
                </div>
              </div>

              <!-- RACI Responsibility Matrix Card -->
              <div class="p-3 bg-slate-50 dark:bg-slate-900 border border-default space-y-2">
                <div class="flex items-center gap-2 font-bold text-xs text-ink uppercase">
                  <app-icon name="users" size="sm" [decorative]="true" />
                  <span>{{ 'attendance.workflows.raci_matrix' | translate }}</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1">
                  <div class="p-2.5 bg-surface border border-default space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-sky-700 dark:text-sky-300">HR Admin / System Admin</span>
                      <span class="px-1.5 py-0.2 text-[9px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200">Accountable</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400">
                      Người cấu hình chính: Thiết lập chính sách, định nghĩa số cấp duyệt, điều kiện rẽ nhánh và kiểm soát thời hạn SLA.
                    </p>
                  </div>
                  <div class="p-2.5 bg-surface border border-default space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-emerald-700 dark:text-emerald-300">Line Manager (Quản lý trực tiếp)</span>
                      <span class="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Responsible</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400">
                      Thẩm định và duyệt Cấp 1 các đơn nghỉ phép, làm thêm giờ OT và phân ca làm việc của nhân viên trong nhóm.
                    </p>
                  </div>
                  <div class="p-2.5 bg-surface border border-default space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-amber-700 dark:text-amber-300">HR Manager / Giám đốc</span>
                      <span class="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Approver</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400">
                      Phê duyệt Cấp 2 cho đơn nghỉ phép dài ngày, phê duyệt ngân sách lương OT và thẩm định/ký duyệt chốt bảng công kỳ.
                    </p>
                  </div>
                  <div class="p-2.5 bg-surface border border-default space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-indigo-700 dark:text-indigo-300">Nhân viên (Employee)</span>
                      <span class="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">Informed</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400">
                      Nộp đơn theo mẫu, nhận thông báo tiến trình phê duyệt đa cấp theo thời gian thực và bấm xác nhận bảng công.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Workflow Policies List -->
            <div class="space-y-3">
              @for (policy of workflowPolicies(); track policy.id) {
                <div class="p-4 bg-surface border border-default space-y-3 shadow-xs">
                  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-default pb-2.5">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-sm text-ink">{{ policy.name }}</span>
                        @if (policy.active) {
                          <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700">ĐANG KÍCH HOẠT</span>
                        } @else {
                          <span class="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">TẠM DỪNG</span>
                        }
                      </div>
                      <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{{ policy.description }}</p>
                    </div>

                    <div class="flex items-center gap-2">
                      <div class="text-right text-[11px] text-slate-600 dark:text-slate-400 mr-2">
                        <div>SLA: <span class="font-bold text-ink">{{ policy.sla_hours }} giờ</span></div>
                        <div class="text-[10px] text-muted">Cập nhật: {{ policy.updated_at }}</div>
                      </div>
                      <button
                        type="button"
                        [attr.data-testid]="'btn-edit-policy-' + policy.id"
                        (click)="openWorkflowPolicyDrawer(policy)"
                        class="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <app-icon name="edit-2" size="xs" [decorative]="true" />
                        <span>{{ 'attendance.workflows.edit_policy' | translate }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Visual Approval Levels Stepper -->
                  <div class="space-y-1.5">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {{ 'attendance.workflows.approval_levels' | translate }} ({{ policy.levels_count }} cấp phê duyệt)
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      @for (lvl of policy.approval_levels; track lvl.level) {
                        <div class="p-2.5 bg-slate-50 dark:bg-slate-900 border border-default flex items-start gap-2.5">
                          <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-300 dark:border-slate-700">
                            {{ lvl.level }}
                          </div>
                          <div class="flex-1 min-w-0 space-y-0.5">
                            <div class="font-bold text-xs text-ink">{{ lvl.role_name }}</div>
                            <div class="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{{ lvl.description }}</div>
                            @if (lvl.condition) {
                              <div class="text-[10px] text-sky-700 dark:text-sky-300 font-semibold pt-0.5">
                                · {{ lvl.condition }}
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
`;

// Insert the workflowTabMarkup before TAB 8: SHIFTS or TAB 9
const shiftTabMarker = `<!-- 8. TAB: SHIFTS (Quản lý ca làm việc & Lịch phân ca) -->`;
html = html.replace(shiftTabMarker, `${workflowTabMarkup}\n        ${shiftTabMarker}`);

// 6. Add Workflow Configuration Drawer before </section> or at drawer section
const workflowDrawerMarkup = `  <!-- DRAWER: CẤU HÌNH QUY TRÌNH PHÊ DUYỆT (HR ADMIN / SYSTEM ADMIN) -->
  <app-drawer
    [isOpen]="isWorkflowDrawerOpen()"
    [title]="selectedWorkflowPolicy()?.name || 'Cấu hình Quy trình'"
    (closed)="closeWorkflowPolicyDrawer()"
  >
    <div class="space-y-4 p-4 text-xs font-sans">
      <div class="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 space-y-1">
        <div class="font-bold text-xs flex items-center gap-1.5">
          <app-icon name="shield" size="xs" [decorative]="true" />
          <span>{{ 'attendance.workflows.configured_by_banner' | translate }}</span>
        </div>
        <p class="text-[11px] leading-relaxed">
          Chính sách phê duyệt này được áp dụng tự động cho toàn bộ nhân sự khi nộp đơn từ trong phân hệ Chấm công.
        </p>
      </div>

      @if (selectedWorkflowPolicy(); as policy) {
        <div class="space-y-3">
          <!-- Active Toggle -->
          <div class="flex items-center justify-between p-3 border border-default bg-surface">
            <div>
              <div class="font-bold text-ink">Trạng thái kích hoạt quy trình</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-400">Cho phép áp dụng luồng phê duyệt này trong thực tế</div>
            </div>
            <button
              type="button"
              (click)="policy.active = !policy.active"
              class="px-3 py-1.5 text-xs font-bold border cursor-pointer"
              [ngClass]="policy.active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'"
            >
              {{ policy.active ? 'ĐANG KÍCH HOẠT' : 'TẠM DỪNG' }}
            </button>
          </div>

          <!-- SLA Input -->
          <div class="p-3 border border-default bg-surface space-y-1.5">
            <label class="font-bold text-ink block">{{ 'attendance.workflows.sla_hours' | translate }}</label>
            <div class="flex items-center gap-2">
              <input
                type="number"
                [(ngModel)]="policy.sla_hours"
                class="w-28 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-ink text-xs font-mono font-bold"
              />
              <span class="text-slate-600 dark:text-slate-400">giờ (Tự động nhắc nhở khi quá hạn)</span>
            </div>
          </div>

          <!-- Levels List in Drawer -->
          <div class="p-3 border border-default bg-surface space-y-2.5">
            <div class="font-bold text-ink text-xs uppercase tracking-wider">
              Danh sách Các Cấp Phê duyệt (Approval Tiers)
            </div>
            @for (lvl of policy.approval_levels; track lvl.level) {
              <div class="p-3 bg-slate-50 dark:bg-slate-900 border border-default space-y-2">
                <div class="flex items-center justify-between font-bold text-ink">
                  <span>Cấp {{ lvl.level }}: {{ lvl.role_name }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-mono">BẮT BUỘC</span>
                </div>
                <div class="text-[11px] text-slate-600 dark:text-slate-400">
                  {{ lvl.description }}
                </div>
                @if (lvl.condition) {
                  <div class="text-[11px] text-sky-700 dark:text-sky-300 font-semibold bg-sky-50 dark:bg-sky-950/30 p-1.5 border border-sky-200 dark:border-sky-800">
                    Điều kiện kích hoạt: {{ lvl.condition }}
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Drawer Footer with High Contrast Buttons -->
        <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 -mx-4 -mb-4 p-4 mt-6">
          <button
            type="button"
            (click)="closeWorkflowPolicyDrawer()"
            class="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-xs"
          >
            {{ 'COMMON_CANCEL' | translate }}
          </button>
          <button
            type="button"
            (click)="saveWorkflowPolicy()"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-600 cursor-pointer shadow-sm"
          >
            Lưu Cấu Hình Quy Trình
          </button>
        </div>
      }
    </div>
  </app-drawer>
`;

// Insert the workflowDrawerMarkup before the closing tags
html = html.replace('</div>\n</div>\n}', `${workflowDrawerMarkup}\n    </div>\n  </div>\n</section>\n}`);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully updated attendance-screen.component.html');
