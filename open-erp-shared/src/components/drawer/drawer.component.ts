import { Component, ChangeDetectionStrategy, input, model, output, HostListener, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { ButtonComponent } from '../button/button.component';
import { DrawerPlacement, DrawerSize } from '../../enums/component.enum';

const PLACEMENT_CLASSES: Record<string, string> = {
  left: 'top-0 bottom-0 left-0 h-full animate-in slide-in-from-left',
  top: 'top-0 left-0 right-0 w-full animate-in slide-in-from-top',
  bottom: 'bottom-0 left-0 right-0 w-full animate-in slide-in-from-bottom',
  right: 'top-0 bottom-0 right-0 h-full animate-in slide-in-from-right'
};

const HORIZONTAL_SIZE_CLASSES: Record<string, string> = {
  sm: 'w-80 max-w-[85vw]',
  lg: 'w-[540px] max-w-[90vw]',
  xl: 'w-[720px] max-w-[95vw]',
  full: 'w-screen',
  md: 'w-96 max-w-[90vw]'
};

const VERTICAL_SIZE_CLASSES: Record<string, string> = {
  sm: 'h-64 max-h-[85vh]',
  lg: 'h-[480px] max-h-[90vh]',
  xl: 'h-[640px] max-h-[95vh]',
  full: 'h-screen',
  md: 'h-96 max-h-[90vh]'
};

@Component({
  selector: 'erp-drawer, erp-sheet, erp-slide-over',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  templateUrl: './drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class DrawerComponent implements OnDestroy {
  readonly visible = model<boolean>(false);
  readonly placement = input<DrawerPlacement | 'left' | 'right' | 'top' | 'bottom'>(DrawerPlacement.RIGHT);
  readonly size = input<DrawerSize | 'sm' | 'md' | 'lg' | 'xl' | 'full'>(DrawerSize.MD);
  readonly title = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly closable = input<boolean>(true);
  readonly maskClosable = input<boolean>(true);
  readonly showFooter = input<boolean>(true);
  readonly okText = input<string>('Xác nhận');
  readonly cancelText = input<string>('Đóng');

  readonly close = output<void>();
  readonly ok = output<void>();

  readonly isHorizontal = computed(() => {
    const p = String(this.placement());
    return p === 'left' || p === 'right';
  });

  readonly placementClasses = computed(() => {
    const p = String(this.placement());
    return PLACEMENT_CLASSES[p] || PLACEMENT_CLASSES['right'];
  });

  readonly sizeClasses = computed(() => {
    const sz = String(this.size());
    if (this.isHorizontal()) {
      return HORIZONTAL_SIZE_CLASSES[sz] || HORIZONTAL_SIZE_CLASSES['md'];
    }
    return VERTICAL_SIZE_CLASSES[sz] || VERTICAL_SIZE_CLASSES['md'];
  });

  constructor() {
    effect(() => {
      const isVis = this.visible();
      if (typeof document !== 'undefined') {
        if (isVis) {
          document.body.classList.add('overflow-hidden');
        } else {
          document.body.classList.remove('overflow-hidden');
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('overflow-hidden');
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible() && this.closable()) {
      this.handleClose();
    }
  }

  handleClose(): void {
    this.visible.set(false);
    this.close.emit();
  }

  onMaskClick(event: MouseEvent): void {
    if (this.maskClosable() && (event.target as HTMLElement).classList.contains('drawer-mask')) {
      this.handleClose();
    }
  }
}
