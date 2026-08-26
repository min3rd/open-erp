import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';
import { ToastPosition } from '../../enums/component.enum';

const POSITION_CLASSES: Record<string, string> = {
  [ToastPosition.TOP_LEFT]: 'top-0 left-0 items-start',
  [ToastPosition.BOTTOM_LEFT]: 'bottom-0 left-0 items-start flex-col-reverse',
  [ToastPosition.BOTTOM_RIGHT]: 'bottom-0 right-0 items-end flex-col-reverse',
  [ToastPosition.TOP_CENTER]: 'top-0 left-1/2 -translate-x-1/2 items-center',
  [ToastPosition.BOTTOM_CENTER]: 'bottom-0 left-1/2 -translate-x-1/2 items-center flex-col-reverse',
  [ToastPosition.TOP_RIGHT]: 'top-0 right-0 items-end'
};

@Component({
  selector: 'erp-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerPositionClasses()"
         class="fixed z-[9999] pointer-events-none p-4 flex flex-col gap-3 transition-all duration-300">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto transition-all duration-300 transform animate-in slide-in-from-top-2 fade-in">
          <erp-toast [toast]="toast" (close)="toastService.dismiss(toast.id)"></erp-toast>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  readonly containerPositionClasses = computed(() => {
    const pos = String(this.toastService.position());
    return POSITION_CLASSES[pos] || POSITION_CLASSES[ToastPosition.TOP_RIGHT];
  });
}
