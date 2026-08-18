import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { ButtonVariant, PopoverPlacement } from '../../enums/component.enum';

@Component({
  selector: 'erp-popconfirm',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  template: `
    <div class="relative inline-block">
      <!-- Target Trigger Element -->
      <div (click)="toggleOpen($event)" class="inline-block cursor-pointer">
        <ng-content></ng-content>
      </div>

      <!-- Popconfirm Modal Dialog Box -->
      @if (isOpen) {
        <div [class]="placementClasses"
             (click)="$event.stopPropagation()"
             class="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-xs min-w-64 transition-all duration-200 animate-in fade-in zoom-in-95">
          
          <div class="flex items-start gap-3 mb-3">
            <div class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <erp-icon [name]="icon" [size]="16"></erp-icon>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 dark:text-white tracking-tight">{{ title }}</h4>
              @if (description) {
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ description }}</p>
              }
            </div>
          </div>

          <!-- Buttons Row -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <erp-button variant="ghost" size="sm" (click)="onCancel()">
              {{ cancelText }}
            </erp-button>
            <erp-button [variant]="okVariant" size="sm" (click)="onConfirm()">
              {{ okText }}
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
  @Input() title: string = 'Bạn có chắc chắn muốn thực hiện?';
  @Input() description?: string;
  @Input() okText: string = 'Đồng ý';
  @Input() cancelText: string = 'Hủy';
  @Input() okVariant: ButtonVariant | 'primary' | 'danger' = ButtonVariant.PRIMARY;
  @Input() icon: IconName = 'help-circle';
  @Input() placement: PopoverPlacement | 'top' | 'bottom' | 'left' | 'right' = PopoverPlacement.TOP;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  isOpen: boolean = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  get placementClasses(): string {
    switch (this.placement) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  }

  toggleOpen(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  onConfirm(): void {
    this.isOpen = false;
    this.confirm.emit();
  }

  onCancel(): void {
    this.isOpen = false;
    this.cancel.emit();
  }
}
