import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'oerp-tabs',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="border-b border-slate-200 dark:border-slate-800">
      <nav class="-mb-px flex gap-6" aria-label="Tabs">
        @for (tab of tabs(); track tab.id) {
          <button
            (click)="tabChange.emit(tab.id)"
            [ngClass]="[
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-150 outline-none select-none cursor-pointer',
              tab.id === activeTabId()
                ? 'border-rose-gold-500 text-rose-gold-600 dark:text-rose-gold-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            ]"
          >
            {{ tab.label }}
          </button>
        }
      </nav>
    </div>
  `
})
export class TabsComponent {
  tabs = input.required<Array<{ id: string, label: string }>>();
  activeTabId = input.required<string>();

  tabChange = output<string>();
}
