import { Component, ChangeDetectionStrategy, input, model, output, ElementRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { KbdComponent } from '../../kbd/kbd.component';
import { DropdownPlacement } from '../../../enums/component.enum';

export interface DropdownMenuItem {
  id?: string;
  label?: string;
  icon?: IconName;
  iconColor?: string;
  shortcut?: string;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  header?: string;
}

const PLACEMENT_CLASSES: Record<string, string> = {
  [DropdownPlacement.BOTTOM_END]: 'top-full right-0 mt-1.5',
  [DropdownPlacement.TOP_START]: 'bottom-full left-0 mb-1.5',
  [DropdownPlacement.TOP_END]: 'bottom-full right-0 mb-1.5',
  [DropdownPlacement.LEFT]: 'top-0 right-full mr-1.5',
  [DropdownPlacement.RIGHT]: 'top-0 left-full ml-1.5',
  [DropdownPlacement.BOTTOM_START]: 'top-full left-0 mt-1.5'
};

@Component({
  selector: 'erp-dropdown-menu, erp-menu',
  standalone: true,
  imports: [CommonModule, IconComponent, KbdComponent],
  templateUrl: './dropdown-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
    }
  `]
})
export class DropdownMenuComponent {
  readonly items = input<DropdownMenuItem[]>([]);
  readonly placement = input<DropdownPlacement | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right'>(DropdownPlacement.BOTTOM_START);
  readonly trigger = input<'click' | 'hover'>('click');
  readonly isOpen = model<boolean>(false);
  readonly closeOnClickOutside = input<boolean>(true);
  readonly closeOnItemClick = input<boolean>(true);
  readonly minWidth = input<string>('12rem');

  readonly itemClick = output<DropdownMenuItem>();

  activeIndex = signal<number>(-1);

  constructor(private elementRef: ElementRef) {}

  readonly placementClasses = computed(() => {
    const p = String(this.placement());
    return PLACEMENT_CLASSES[p] || PLACEMENT_CLASSES[DropdownPlacement.BOTTOM_START];
  });

  readonly actionableItems = computed(() => {
    return this.items().filter(item => item.label && !item.header && !item.divider);
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.closeOnClickOutside() || !this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const open = this.isOpen();
    const actions = this.actionableItems();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          this.open();
        } else if (actions.length > 0) {
          let next = this.activeIndex() + 1;
          while (next < actions.length && actions[next].disabled) {
            next++;
          }
          if (next < actions.length) {
            this.activeIndex.set(next);
          }
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (open && actions.length > 0) {
          let prev = this.activeIndex() - 1;
          while (prev >= 0 && actions[prev].disabled) {
            prev--;
          }
          if (prev >= 0) {
            this.activeIndex.set(prev);
          }
        }
        break;

      case 'Enter':
      case ' ':
        if (open && this.activeIndex() >= 0 && this.activeIndex() < actions.length) {
          event.preventDefault();
          const target = actions[this.activeIndex()];
          if (!target.disabled) {
            this.onItemSelect(target, event);
          }
        } else if (!open && this.trigger() === 'click') {
          event.preventDefault();
          this.open();
        }
        break;

      case 'Escape':
        if (open) {
          event.preventDefault();
          this.close();
        }
        break;

      case 'Tab':
        if (open) {
          this.close();
        }
        break;
    }
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this.isOpen.set(true);
    this.activeIndex.set(0);
  }

  close(): void {
    this.isOpen.set(false);
    this.activeIndex.set(-1);
  }

  onMouseEnter(): void {
    if (this.trigger() === 'hover') {
      this.open();
    }
  }

  onMouseLeave(): void {
    if (this.trigger() === 'hover') {
      this.close();
    }
  }

  onItemSelect(item: DropdownMenuItem, event: MouseEvent | KeyboardEvent): void {
    if (item.disabled || item.divider || item.header) {
      event.stopPropagation();
      return;
    }
    this.itemClick.emit(item);
    if (this.closeOnItemClick()) {
      this.close();
    }
  }
}
