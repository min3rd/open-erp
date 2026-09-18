import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sharp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sharp-input.component.html'
})
export class SharpInputComponent {
  id = input<string>(`input-${Math.random().toString(36).substring(2, 7)}`);
  label = input<string>('');
  type = input<string>('text');
  placeholder = input<string>('');
  hint = input<string>('');
  error = input<string | null>(null);
  disabled = input<boolean>(false);
  required = input<boolean>(false);

  value = model<string>('');
}
