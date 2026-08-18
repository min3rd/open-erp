import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
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

@Component({
  selector: 'erp-dropdown-menu, erp-menu',
  standalone: true,
  imports: [CommonModule, IconComponent, KbdComponent],
  templateUrl: './dropdown-menu.component.html',
  styles: [`
    :host {
      display: inline-block;
      position: relative;
    }
  `]
})
export class DropdownMenuComponent {
  @Input() items: DropdownMenuItem[] = [];
  @Input() placement: DropdownPlacement | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right' = DropdownPlacement.BOTTOM_START;
  @Input() trigger: 'click' | 'hover' = 'click';
  @Input() isOpen: boolean = false;
  @Input() closeOnClickOutside: boolean = true;
  @Input() closeOnItemClick: boolean = true;
  @Input() minWidth: string = '12rem';

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() itemClick = new EventEmitter<DropdownMenuItem>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.closeOnClickOutside || !this.isOpen) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }

  open(): void {
    if (!this.isOpen) {
      this.isOpen = true;
      this.isOpenChange.emit(true);
    }
  }

  close(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.isOpenChange.emit(false);
    }
  }

  onMouseEnter(): void {
    if (this.trigger === 'hover') {
      this.open();
    }
  }

  onMouseLeave(): void {
    if (this.trigger === 'hover') {
      this.close();
    }
  }

  onItemSelect(item: DropdownMenuItem, event: MouseEvent): void {
    if (item.disabled || item.divider || item.header) {
      event.stopPropagation();
      return;
    }
    this.itemClick.emit(item);
    if (this.closeOnItemClick) {
      this.close();
    }
  }

  getPlacementClasses(): string {
    const p = String(this.placement);
    switch (p) {
      case DropdownPlacement.BOTTOM_END:
      case 'bottom-end':
        return 'top-full right-0 mt-1.5';
      case DropdownPlacement.TOP_START:
      case 'top-start':
        return 'bottom-full left-0 mb-1.5';
      case DropdownPlacement.TOP_END:
      case 'top-end':
        return 'bottom-full right-0 mb-1.5';
      case DropdownPlacement.LEFT:
      case 'left':
        return 'top-0 right-full mr-1.5';
      case DropdownPlacement.RIGHT:
      case 'right':
        return 'top-0 left-full ml-1.5';
      case DropdownPlacement.BOTTOM_START:
      case 'bottom-start':
      default:
        return 'top-full left-0 mt-1.5';
    }
  }
}
