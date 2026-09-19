import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sharp-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sharp-textarea.component.html'
})
export class SharpTextareaComponent {
  id = input<string>(`textarea-${Math.random().toString(36).substring(2, 7)}`);
  label = input<string>('');
  placeholder = input<string>('');
  rows = input<number>(3);
  maxlength = input<number | null>(null);
  error = input<string | null>(null);
  disabled = input<boolean>(false);
  required = input<boolean>(false);

  value = model<string>('');
}
