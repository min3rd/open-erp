import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'oerp-textarea',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './textarea.component.html'
})
export class TextareaComponent {
  label = input<string>('');
  placeholder = input<string>('');
  control = input<FormControl>(new FormControl());
  rows = input<number>(3);
  errorMessage = input<string>('');

  hasError(): boolean {
    const ctrl = this.control();
    return ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }
}
