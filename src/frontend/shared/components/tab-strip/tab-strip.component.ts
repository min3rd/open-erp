import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';

export interface TabItem {
  id: string;
  labelKey: string;
}

/** Compact, sharp tab strip used by settings and plugin settings tabs. */
@Component({
  selector: 'app-tab-strip',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './tab-strip.component.html',
})
export class TabStripComponent {
  tabs = input.required<ReadonlyArray<TabItem>>();
  activeId = input.required<string>();
  activeChange = output<string>();

  select(id: string): void {
    if (id !== this.activeId()) {
      this.activeChange.emit(id);
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    if (tabs.length === 0) {
      return;
    }
    let next = index;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        next = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select(tabs[next].id);
    const target = document.getElementById(`tab-${tabs[next].id}`);
    target?.focus();
  }
}
