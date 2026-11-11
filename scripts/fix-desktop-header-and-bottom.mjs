import fs from 'node:fs';

const filePath = 'plugins/attendance/web/src/app/attendance-screen.component.html';
let html = fs.readFileSync(filePath, 'utf8');

// 1. Replace the old desktop header & tab bar
const startMarker = `  <!-- Desktop View -->
  @if (!isMobile()) {
    <div class="flex-1 flex flex-col">
      <!-- Desktop Header & Tab Bar -->`;

const endMarker = `      <!-- Tab Content Area -->
      <div class="p-4 flex-1 overflow-y-auto space-y-4">`;

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `  <!-- Desktop View -->
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

  html = html.substring(0, startIdx) + replacement + html.substring(endIdx + endMarker.length);
  console.log('Successfully replaced desktop header and tab strip.');
} else {
  console.error('Could not find header markers:', { startIdx, endIdx });
}

// 2. Fix the closing tag at the end of the file
const badBottomMarker = `  </app-drawer>

    </div>
  }
</section>
}`;

const goodBottomMarker = `  </app-drawer>
</section>
}`;

if (html.includes(badBottomMarker)) {
  html = html.replace(badBottomMarker, goodBottomMarker);
  console.log('Successfully fixed bottom closing tags.');
} else {
  // Let's replace any trailing closing tags
  html = html.replace(/<\/app-drawer>\s*<\/div>\s*\}\s*<\/section>\s*\}\s*$/, `</app-drawer>\n</section>\n}\n`);
  console.log('Applied regex fix for bottom closing tags.');
}

// Also, in the main content area, we opened `<main class="flex-1 p-4 space-y-4 overflow-y-auto">`
// Let's ensure the closing tag for it at lines before drawers is `</main>` instead of `</div>`
const oldMainClose = `          </div>
        }
      </div>
    </div>
  }`;

const newMainClose = `          </div>
        }
      </main>
    </div>
  }`;

if (html.includes(oldMainClose)) {
  html = html.replace(oldMainClose, newMainClose);
  console.log('Successfully replaced oldMainClose with newMainClose.');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Finished fix-desktop-header-and-bottom.mjs');

