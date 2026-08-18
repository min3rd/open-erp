import { Component, Input, Output, EventEmitter, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { DrawerPlacement, DrawerSize } from '../../enums/component.enum';

@Component({
  selector: 'erp-drawer, erp-sheet, erp-slide-over',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  templateUrl: './drawer.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class DrawerComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() placement: DrawerPlacement | 'left' | 'right' | 'top' | 'bottom' = DrawerPlacement.RIGHT;
  @Input() size: DrawerSize | 'sm' | 'md' | 'lg' | 'xl' | 'full' = DrawerSize.MD;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: IconName;
  @Input() closable: boolean = true;
  @Input() maskClosable: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() okText: string = 'Xác nhận';
  @Input() cancelText: string = 'Đóng';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();
  @Output() ok = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible && this.closable) {
      this.handleClose();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (typeof document !== 'undefined') {
        if (this.visible) {
          document.body.classList.add('overflow-hidden');
        } else {
          document.body.classList.remove('overflow-hidden');
        }
      }
    }
  }

  get isHorizontal(): boolean {
    return this.placement === 'left' || this.placement === 'right';
  }

  get placementClasses(): string {
    switch (this.placement) {
      case 'left':
        return 'top-0 bottom-0 left-0 h-full animate-in slide-in-from-left';
      case 'top':
        return 'top-0 left-0 right-0 w-full animate-in slide-in-from-top';
      case 'bottom':
        return 'bottom-0 left-0 right-0 w-full animate-in slide-in-from-bottom';
      case 'right':
      default:
        return 'top-0 bottom-0 right-0 h-full animate-in slide-in-from-right';
    }
  }

  get sizeClasses(): string {
    if (this.isHorizontal) {
      switch (this.size) {
        case 'sm':
          return 'w-80 max-w-[85vw]';
        case 'lg':
          return 'w-[540px] max-w-[90vw]';
        case 'xl':
          return 'w-[720px] max-w-[95vw]';
        case 'full':
          return 'w-screen';
        case 'md':
        default:
          return 'w-96 max-w-[90vw]';
      }
    } else {
      switch (this.size) {
        case 'sm':
          return 'h-64 max-h-[85vh]';
        case 'lg':
          return 'h-[480px] max-h-[90vh]';
        case 'xl':
          return 'h-[640px] max-h-[95vh]';
        case 'full':
          return 'h-screen';
        case 'md':
        default:
          return 'h-96 max-h-[90vh]';
      }
    }
  }

  handleClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.close.emit();
  }

  onMaskClick(event: MouseEvent): void {
    if (this.maskClosable && (event.target as HTMLElement).classList.contains('drawer-mask')) {
      this.handleClose();
    }
  }
}
