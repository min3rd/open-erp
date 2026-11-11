import fs from 'node:fs';

const filePath = 'plugins/attendance/web/src/app/attendance-screen.component.html';
let html = fs.readFileSync(filePath, 'utf8');

// 1. Remove duplicate kiosk block
const dupKioskStart = `          <div class="space-y-4 font-mono text-xs">
            <!-- Header Toolbar -->
            <div class="p-4 bg-surface border border-neutral-200 dark:border-neutral-800 space-y-4">`;

const dupKioskEnd = `                          <td class="p-2.5 text-center">
                            <span class="px-1.5 py-0.5 bg-success/20 text-success border border-success/40 text-[10px] font-bold">
                              {{ 'attendance.kiosk.auth_success' | translate }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        }`;

if (html.includes(dupKioskStart)) {
  const startIdx = html.indexOf(dupKioskStart);
  const endMarker = dupKioskEnd;
  const endIdx = html.indexOf(endMarker);
  if (startIdx !== -1 && endIdx !== -1) {
    const fullEndIdx = endIdx + endMarker.length;
    html = html.substring(0, startIdx) + '          </div>\n        }' + html.substring(fullEndIdx);
    console.log('Successfully removed duplicate kiosk block.');
  } else {
    console.error('Could not find start/end of duplicate kiosk block.');
  }
}

// 2. Add Workflow Drawer and properly close the section at the bottom
const workflowDrawerMarkup = `
  <!-- DRAWER: CẤU HÌNH QUY TRÌNH PHÊ DUYỆT (HR ADMIN / SYSTEM ADMIN) -->
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

// Fix the bottom of file
const oldBottom = `    </div>
  </app-drawer>
</div>
}`;

const newBottom = `    </div>
  </app-drawer>
${workflowDrawerMarkup}
    </div>
  }
</section>
}`;

if (html.includes(oldBottom)) {
  html = html.replace(oldBottom, newBottom);
  console.log('Successfully replaced oldBottom with newBottom.');
} else {
  // Try regex replace
  html = html.replace(/<\/app-drawer>\s*<\/div>\s*\}\s*$/, `</app-drawer>\n${workflowDrawerMarkup}\n    </div>\n  }\n</section>\n}\n`);
  console.log('Replaced bottom via regex.');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Finished fix-html-structure.mjs');

