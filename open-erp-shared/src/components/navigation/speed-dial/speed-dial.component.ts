import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SpeedDialDirection, SpeedDialPosition } from '../../../enums/component.enum';

export interface SpeedDialAction {
  id: string;
  label?: string;
  icon: IconName;
  color?: string; // custom bg or text class
  disabled?: boolean;
}

@Component({
  selector: 'erp-speed-dial, erp-fab-menu',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './speed-dial.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SpeedDialComponent {
  @Input() items: SpeedDialAction[] = [];
  @Input() icon: IconName = 'plus';
  @Input() activeIcon: IconName = 'x';
  @Input() direction: SpeedDialDirection | 'up' | 'down' | 'left' | 'right' = SpeedDialDirection.UP;
  @Input() position: SpeedDialPosition | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' = SpeedDialPosition.BOTTOM_RIGHT;
  @Input() open: boolean = false;
  @Input() showBackdrop: boolean = false;
  @Input() showLabels: boolean = true;
  @Input() fixed: boolean = true;

  @Output() actionClick = new EventEmitter<SpeedDialAction>();
  @Output() openChange = new EventEmitter<boolean>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open && !this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    this.open = !this.open;
    this.openChange.emit(this.open);
  }

  close(): void {
    if (this.open) {
      this.open = false;
      this.openChange.emit(false);
    }
  }

  onActionClick(action: SpeedDialAction, event: MouseEvent): void {
    if (action.disabled) return;
    event.stopPropagation();
    this.actionClick.emit(action);
    this.close();
  }

  getPositionClasses(): string {
    const pos = String(this.position);
    switch (pos) {
      case SpeedDialPosition.BOTTOM_LEFT:
      case 'bottom-left':
        return 'bottom-6 left-6';
      case SpeedDialPosition.TOP_RIGHT:
      case 'top-right':
        return 'top-6 right-6';
      case SpeedDialPosition.TOP_LEFT:
      case 'top-left':
        return 'top-6 left-6';
      case SpeedDialPosition.BOTTOM_RIGHT:
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  }

  get isVerticalDirection(): boolean {
    const d = String(this.direction);
    return d === 'up' || d === 'down';
  }

  get isHorizontalDirection(): boolean {
    const d = String(this.direction);
    return d === 'left' || d === 'right';
  }

  getDirectionContainerClasses(): string {
    const d = String(this.direction);
    switch (d) {
      case SpeedDialDirection.DOWN:
      case 'down':
        return 'flex-col top-full mt-3';
      case SpeedDialDirection.LEFT:
      case 'left':
        return 'flex-row-reverse right-full mr-3';
      case SpeedDialDirection.RIGHT:
      case 'right':
        return 'flex-row left-full ml-3';
      case SpeedDialDirection.UP:
      case 'up':
      default:
        return 'flex-col-reverse bottom-full mb-3';
    }
  }
}
