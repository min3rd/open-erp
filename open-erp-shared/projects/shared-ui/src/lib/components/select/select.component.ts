import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-select',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, IconComponent],
  templateUrl: './select.component.html'
})
export class SelectComponent {
  label = input<string>('');
  placeholder = input<string>('');
  options = input.required<Array<{ label: string, value: any }>>();
  control = input<FormControl>(new FormControl());
  errorMessage = input<string>('');

  hasError(): boolean {
    const ctrl = this.control();
    return ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }
}
