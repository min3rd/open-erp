import { Component, Input, Output, EventEmitter, HostListener, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { ModalSize } from '../../enums/component.enum';

@Component({
  selector: 'erp-modal, erp-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  templateUrl: './modal.component.html',
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ModalComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: IconName;
  @Input() size: ModalSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' = ModalSize.MD;
  @Input() closable: boolean = true;
  @Input() maskClosable: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() okText: string = 'Xác nhận';
  @Input() cancelText: string = 'Hủy bỏ';
  @Input() okLoading: boolean = false;
  @Input() centered: boolean = true;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() ok = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible && this.closable) {
      this.close();
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

  get sizeClasses(): string {
    switch (this.size) {
      case 'xs':
        return 'max-w-xs';
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-[95vw] h-[90vh]';
      case 'md':
      default:
        return 'max-w-lg';
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
  }

  onMaskClick(event: MouseEvent): void {
    if (this.maskClosable && (event.target as HTMLElement).classList.contains('modal-mask')) {
      this.close();
    }
  }

  handleOk(): void {
    this.ok.emit();
  }
}
