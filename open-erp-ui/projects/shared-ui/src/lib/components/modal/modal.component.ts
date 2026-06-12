import { Component, input, output } from '@angular/core';

@Component({
  selector: 'oerp-modal',
  standalone: true,
  imports: [],
  template: `
    <!-- Modal Backdrop -->
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        (click)="closeModal()"
      >
        <!-- Modal Content Window -->
        <div
          class="relative w-full max-w-lg p-6 rounded-2xl shadow-2xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 transform transition-all duration-300 scale-100"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-base font-semibold leading-6">
              {{ title() }}
            </h3>
            <button
              type="button"
              (click)="closeModal()"
              class="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
            >
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="mt-4">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');

  onClose = output<void>();

  closeModal(): void {
    this.onClose.emit();
  }
}
