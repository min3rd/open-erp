import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'oerp-checkbox',
  standalone: true,
  imports: [NgClass],
  templateUrl: './checkbox.component.html'
})
export class CheckboxComponent {
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
