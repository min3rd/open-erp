import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'erp-list-item',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ListItemComponent {
  readonly title = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly clickable = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly active = input<boolean>(false);

  readonly itemClick = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled() && this.clickable()) {
      this.itemClick.emit(event);
    }
  }
}
