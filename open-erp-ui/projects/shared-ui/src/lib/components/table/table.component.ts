import { Component, input } from '@angular/core';

@Component({
  selector: 'oerp-table',
  standalone: true,
  templateUrl: './table.component.html'
})
export class TableComponent {
  headers = input.required<Array<string>>();
  data = input.required<Array<any>>();
}
