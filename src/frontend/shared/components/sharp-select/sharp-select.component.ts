import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { SelectOption } from '../../models/ui.model';

@Component({
  selector: 'app-sharp-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './sharp-select.component.html'
})
export class SharpSelectComponent {
  id = input<string>(`select-${Math.random().toString(36).substring(2, 7)}`);
  label = input<string>('');
  options = input<SelectOption[]>([]);
  hint = input<string>('');
  error = input<string | null>(null);
  disabled = input<boolean>(false);
  required = input<boolean>(false);

  value = model<string>('');
}
