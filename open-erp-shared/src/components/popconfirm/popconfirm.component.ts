import { Component, ChangeDetectionStrategy, input, output, ElementRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { ButtonVariant, PopoverPlacement } from '../../enums/component.enum';

const PLACEMENT_CLASSES: Record<string, string> = {
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2'
};

@Component({
  selector: 'erp-popconfirm',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block">
      <!-- Target Trigger Element -->
      <div (click)="toggleOpen($event)" class="inline-block cursor-pointer">
        <ng-content></ng-content>
      </div>

      <!-- Popconfirm Modal Dialog Box -->
      @if (isOpen()) {
        <div [class]="placementClasses()"
             (click)="$event.stopPropagation()"
             class="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-xs min-w-64 transition-all duration-200 animate-in fade-in zoom-in-95">
          
          <div class="flex items-start gap-3 mb-3">
            <div class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <erp-icon [name]="icon()" [size]="16"></erp-icon>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 dark:text-white tracking-tight">{{ title() }}</h4>
              @if (description()) {
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ description() }}</p>
              }
            </div>
          </div>

          <!-- Buttons Row -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <erp-button variant="ghost" size="sm" (click)="onCancel()">
              {{ cancelText() }}
            </erp-button>
            <erp-button [variant]="okVariant()" size="sm" (click)="onConfirm()">
              {{ okText() }}
            </erp-button>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
    }
  `]
})
export class PopconfirmComponent {
  readonly title = input<string>('Bạn có chắc chắn muốn thực hiện?');
  readonly description = input<string | undefined>(undefined);
  readonly okText = input<string>('Đồng ý');
  readonly cancelText = input<string>('Hủy');
  readonly okVariant = input<ButtonVariant | 'primary' | 'danger'>(ButtonVariant.PRIMARY);
  readonly icon = input<IconName>('help-circle');
  readonly placement = input<PopoverPlacement | 'top' | 'bottom' | 'left' | 'right'>(PopoverPlacement.TOP);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  isOpen = signal<boolean>(false);

  constructor(private elementRef: ElementRef) {}

  readonly placementClasses = computed(() => {
    const p = String(this.placement());
    return PLACEMENT_CLASSES[p] || PLACEMENT_CLASSES['top'];
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  onConfirm(): void {
    this.isOpen.set(false);
    this.confirm.emit();
  }

  onCancel(): void {
    this.isOpen.set(false);
    this.cancel.emit();
  }
}
