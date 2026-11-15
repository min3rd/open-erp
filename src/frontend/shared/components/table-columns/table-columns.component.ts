import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { IconComponent } from '../icon/icon.component';

export interface TableColumnOption {
  key: string;
  labelKey: string;
}

/**
 * Compact column chooser: toggle visibility and move columns left/right.
 * Callers own the persisted order/hidden arrays.
 */
@Component({
  selector: 'app-table-columns',
  standalone: true,
  imports: [CommonModule, TranslatePipe, IconComponent],
  templateUrl: './table-columns.component.html',
})
export class TableColumnsComponent {
  columns = input<TableColumnOption[]>([]);
  order = input<string[]>([]);
  hidden = input<string[]>([]);
  orderChange = output<string[]>();
  hiddenChange = output<string[]>();

  readonly open = signal(false);

  readonly ordered = computed(() => {
    const keys = this.order().length ? this.order() : this.columns().map((c) => c.key);
    return keys
      .map((key) => this.columns().find((c) => c.key === key))
      .filter((column): column is TableColumnOption => Boolean(column));
  });

  isHidden(key: string): boolean {
    return this.hidden().includes(key);
  }

  toggle(key: string): void {
    const next = this.hidden().includes(key)
      ? this.hidden().filter((item) => item !== key)
      : [...this.hidden(), key];
    this.hiddenChange.emit(next);
  }

  move(key: string, delta: number): void {
    const keys = this.ordered().map((c) => c.key);
    const index = keys.indexOf(key);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= keys.length) {
      return;
    }
    const next = [...keys];
    [next[index], next[target]] = [next[target], next[index]];
    this.orderChange.emit(next);
  }
}
