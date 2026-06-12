import { Component, input } from '@angular/core';

@Component({
  selector: 'oerp-card',
  standalone: true,
  template: `
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
      <!-- Header -->
      @if (title() || subtitle()) {
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col gap-0.5">
          @if (title()) {
            <h3 class="text-base font-semibold text-slate-950 dark:text-slate-50 tracking-tight">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">{{ subtitle() }}</p>
          }
        </div>
      }
      
      <!-- Body -->
      <div class="px-6 py-5 flex-grow text-sm text-slate-600 dark:text-slate-300">
        <ng-content></ng-content>
      </div>

      <!-- Footer (optional content projection) -->
      <div class="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3 empty:hidden">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {
  title = input<string>('');
  subtitle = input<string>('');
}
