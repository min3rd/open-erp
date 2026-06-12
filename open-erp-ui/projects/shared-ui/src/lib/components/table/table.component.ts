import { Component, input } from '@angular/core';

@Component({
  selector: 'oerp-table',
  standalone: true,
  template: `
    <div class="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
      <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
        <thead class="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider select-none">
          <tr>
            @for (header of headers(); track header) {
              <th scope="col" class="px-6 py-3.5 font-semibold">{{ header }}</th>
            }
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-350">
          @for (row of data(); track row) {
            <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              @for (header of headers(); track header) {
                <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                  {{ row[header] !== undefined ? row[header] : '' }}
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="headers().length" class="px-6 py-10 text-center text-slate-400 dark:text-slate-500 font-medium">
                Không có dữ liệu hiển thị.
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `
})
export class TableComponent {
  headers = input.required<Array<string>>();
  data = input.required<Array<any>>();
}
