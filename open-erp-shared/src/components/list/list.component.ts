import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'erp-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ListComponent {
  @Input() header?: string;
  @Input() footer?: string;
  @Input() bordered: boolean = true;
  @Input() striped: boolean = false;
  @Input() hoverable: boolean = true;
  @Input() compact: boolean = false;
}
