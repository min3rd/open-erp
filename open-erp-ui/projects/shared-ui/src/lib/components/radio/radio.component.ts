import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'oerp-radio',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './radio.component.html'
})
export class RadioComponent {
  name = input.required<string>();
  options = input.required<Array<{ label: string, value: any }>>();
  control = input<FormControl>(new FormControl());
}
