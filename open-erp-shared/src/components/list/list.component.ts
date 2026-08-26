import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'erp-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ListComponent {
  readonly header = input<string | undefined>(undefined);
  readonly footer = input<string | undefined>(undefined);
  readonly bordered = input<boolean>(true);
  readonly striped = input<boolean>(false);
  readonly hoverable = input<boolean>(true);
  readonly compact = input<boolean>(false);
}
