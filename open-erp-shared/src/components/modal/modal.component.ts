import { Component, ChangeDetectionStrategy, input, model, output, HostListener, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { ModalSize } from '../../enums/component.enum';

const SIZE_CLASSES: Record<string, string> = {
  [ModalSize.XS]: 'max-w-xs',
  [ModalSize.SM]: 'max-w-sm',
  [ModalSize.MD]: 'max-w-lg',
  [ModalSize.LG]: 'max-w-2xl',
  [ModalSize.XL]: 'max-w-4xl',
  [ModalSize.FULL]: 'max-w-[95vw] h-[90vh]'
};

@Component({
  selector: 'erp-modal, erp-dialog',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ModalComponent implements OnDestroy {
  readonly visible = model<boolean>(false);
  readonly title = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly size = input<ModalSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>(ModalSize.MD);
  readonly closable = input<boolean>(true);
  readonly maskClosable = input<boolean>(true);
  readonly showFooter = input<boolean>(true);
  readonly okText = input<string>('Xác nhận');
  readonly cancelText = input<string>('Hủy bỏ');
  readonly okLoading = input<boolean>(false);
  readonly centered = input<boolean>(true);

  readonly ok = output<void>();
  readonly cancel = output<void>();

  constructor() {
    effect(() => {
      const isVisible = this.visible();
      if (typeof document !== 'undefined') {
        if (isVisible) {
          document.body.classList.add('overflow-hidden');
        } else {
          document.body.classList.remove('overflow-hidden');
        }
      }
    });
  }

  readonly sizeClasses = computed(() => {
    const s = String(this.size());
    return SIZE_CLASSES[s] || SIZE_CLASSES[ModalSize.MD];
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible() && this.closable()) {
      this.close();
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('overflow-hidden');
    }
  }

  close(): void {
    this.visible.set(false);
    this.cancel.emit();
  }

  onMaskClick(event: MouseEvent): void {
    if (this.maskClosable() && (event.target as HTMLElement).classList.contains('modal-mask')) {
      this.close();
    }
  }

  handleOk(): void {
    this.ok.emit();
  }
}
