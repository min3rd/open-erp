import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class AccordionComponent {
  readonly items = input<AccordionItem[]>([]);
  readonly expandMultiple = input<boolean>(false);
  readonly bordered = input<boolean>(true);
  readonly ghost = input<boolean>(false);

  readonly itemToggle = output<{ item: AccordionItem; index: number; expanded: boolean }>();

  toggleItem(item: AccordionItem, index: number): void {
    if (item.disabled) return;

    const nextState = !item.expanded;

    if (!this.expandMultiple() && nextState) {
      this.items().forEach((it, i) => {
        if (i !== index) it.expanded = false;
      });
    }

    item.expanded = nextState;
    this.itemToggle.emit({ item, index, expanded: nextState });
  }

  onKeyDown(event: KeyboardEvent, item: AccordionItem, index: number): void {
    if (item.disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleItem(item, index);
    }
  }
}
