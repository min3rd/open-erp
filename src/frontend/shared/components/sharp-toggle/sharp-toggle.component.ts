import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sharp-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sharp-toggle.component.html'
})
export class SharpToggleComponent {
  checked = model<boolean>(false);
  disabled = input<boolean>(false);
  ariaLabel = input<string>('');

  toggle() {
    if (!this.disabled()) {
      this.checked.set(!this.checked());
    }
  }
}
