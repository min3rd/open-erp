import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'oerp-switch',
  standalone: true,
  imports: [NgClass],
  templateUrl: './switch.component.html'
})
export class SwitchComponent {
  label = input<string>('');
  checked = input<boolean>(false);
  disabled = input<boolean>(false);

  checkedChange = output<boolean>();

  onToggle(event: Event): void {
    if (!this.disabled()) {
      const isChecked = (event.target as HTMLInputElement).checked;
      this.checkedChange.emit(isChecked);
    }
  }
}
