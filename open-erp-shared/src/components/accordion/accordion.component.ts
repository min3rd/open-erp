import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

export interface AccordionItem {
  id?: string;
  title: string;
  subtitle?: string;
  content?: string;
  icon?: IconName;
  badge?: string | number;
  badgeColor?: string;
  expanded?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'erp-accordion, erp-collapse',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './accordion.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class AccordionComponent {
  @Input() items: AccordionItem[] = [];
  @Input() expandMultiple: boolean = false;
  @Input() bordered: boolean = true;
  @Input() ghost: boolean = false;

  @Output() itemToggle = new EventEmitter<{ item: AccordionItem; index: number; expanded: boolean }>();

  toggleItem(item: AccordionItem, index: number): void {
    if (item.disabled) return;

    const nextState = !item.expanded;

    if (!this.expandMultiple && nextState) {
      this.items.forEach((it, i) => {
        if (i !== index) it.expanded = false;
      });
    }

    item.expanded = nextState;
    this.itemToggle.emit({ item, index, expanded: nextState });
  }
}
