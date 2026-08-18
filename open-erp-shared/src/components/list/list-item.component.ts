import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'erp-list-item',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './list-item.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ListItemComponent {
  @Input() title?: string;
  @Input() description?: string;
  @Input() icon?: IconName;
  @Input() clickable: boolean = false;
  @Input() disabled: boolean = false;
  @Input() active: boolean = false;

  @Output() itemClick = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled && this.clickable) {
      this.itemClick.emit(event);
    }
  }
}
