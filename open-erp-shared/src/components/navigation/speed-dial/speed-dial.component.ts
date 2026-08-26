import { Component, ChangeDetectionStrategy, input, model, output, ElementRef, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SpeedDialDirection, SpeedDialPosition } from '../../../enums/component.enum';

export interface SpeedDialAction {
  id: string;
  label?: string;
  icon: IconName;
  color?: string;
  disabled?: boolean;
}

const POSITION_CLASSES: Record<string, string> = {
  [SpeedDialPosition.BOTTOM_LEFT]: 'bottom-6 left-6',
  [SpeedDialPosition.TOP_RIGHT]: 'top-6 right-6',
  [SpeedDialPosition.TOP_LEFT]: 'top-6 left-6',
  [SpeedDialPosition.BOTTOM_RIGHT]: 'bottom-6 right-6'
};

const DIRECTION_CONTAINER_CLASSES: Record<string, string> = {
  [SpeedDialDirection.DOWN]: 'flex-col top-full mt-3',
  [SpeedDialDirection.LEFT]: 'flex-row-reverse right-full mr-3',
  [SpeedDialDirection.RIGHT]: 'flex-row left-full ml-3',
  [SpeedDialDirection.UP]: 'flex-col-reverse bottom-full mb-3'
};

@Component({
  selector: 'erp-speed-dial, erp-fab-menu',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './speed-dial.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SpeedDialComponent {
  readonly items = input<SpeedDialAction[]>([]);
  readonly icon = input<IconName>('plus');
  readonly activeIcon = input<IconName>('x');
  readonly direction = input<SpeedDialDirection | 'up' | 'down' | 'left' | 'right'>(SpeedDialDirection.UP);
  readonly position = input<SpeedDialPosition | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>(SpeedDialPosition.BOTTOM_RIGHT);
  readonly open = model<boolean>(false);
  readonly showBackdrop = input<boolean>(false);
  readonly showLabels = input<boolean>(true);
  readonly fixed = input<boolean>(true);

  readonly actionClick = output<SpeedDialAction>();

  constructor(private elementRef: ElementRef) {}

  readonly positionClass = computed(() => {
    const pos = String(this.position());
    return POSITION_CLASSES[pos] || POSITION_CLASSES[SpeedDialPosition.BOTTOM_RIGHT];
  });

  readonly isVerticalDirection = computed(() => {
    const d = String(this.direction());
    return d === 'up' || d === 'down';
  });

  readonly isHorizontalDirection = computed(() => {
    const d = String(this.direction());
    return d === 'left' || d === 'right';
  });

  readonly directionContainerClass = computed(() => {
    const d = String(this.direction());
    return DIRECTION_CONTAINER_CLASSES[d] || DIRECTION_CONTAINER_CLASSES[SpeedDialDirection.UP];
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    this.open.update(v => !v);
  }

  close(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }

  onActionClick(action: SpeedDialAction, event: MouseEvent): void {
    if (action.disabled) return;
    event.stopPropagation();
    this.actionClick.emit(action);
    this.close();
  }
}
