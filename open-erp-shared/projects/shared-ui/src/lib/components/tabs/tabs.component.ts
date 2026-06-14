import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'oerp-tabs',
  standalone: true,
  imports: [NgClass],
  templateUrl: './tabs.component.html'
})
export class TabsComponent {
  tabs = input.required<Array<{ id: string, label: string }>>();
  activeTabId = input.required<string>();

  tabChange = output<string>();
}
