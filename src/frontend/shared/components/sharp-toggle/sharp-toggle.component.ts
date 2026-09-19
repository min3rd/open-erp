import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToggleSize = 'sm' | 'touch';

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
  title = input<string>('');
  /** `touch` expands the hit area to >= 40px (mobile) without changing the visual track. */
  size = input<ToggleSize>('sm');

  toggle() {
    if (!this.disabled()) {
      this.checked.set(!this.checked());
    }
  }
}
