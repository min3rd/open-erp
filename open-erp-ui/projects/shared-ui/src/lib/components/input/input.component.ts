import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-input',
  standalone: true,
  host: {
    class: 'block w-full'
  },
  imports: [NgClass, ReactiveFormsModule, IconComponent],
  templateUrl: './input.component.html'
})
export class InputComponent {
  label = input<string>('');
  type = input<string>('text');
  placeholder = input<string>('');
  control = input<FormControl>(new FormControl());
  errorMessage = input<string>('');
  prefixIcon = input<string | undefined>(undefined);
  suffixIcon = input<string | undefined>(undefined);

  hasError(): boolean {
    const ctrl = this.control();
    return ctrl && ctrl.invalid && ctrl.dirty;
  }
}
