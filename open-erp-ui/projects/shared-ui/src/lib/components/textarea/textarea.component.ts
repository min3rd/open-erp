import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'oerp-textarea',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  template: `
    <div class="flex flex-col w-full gap-1.5">
      @if (label()) {
        <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {{ label() }}
        </label>
      }

      <textarea
        [placeholder]="placeholder()"
        [formControl]="control()"
        [rows]="rows()"
        [ngClass]="[
          'block w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
          hasError()
            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-slate-200 dark:border-slate-700 focus:border-rose-gold-500 focus:ring-1 focus:ring-rose-gold-500'
        ]"
      ></textarea>

      @if (hasError()) {
        <span class="text-xs font-medium text-red-500 animate-fade-in">
          {{ errorMessage() || 'Thông tin không hợp lệ.' }}
        </span>
      }
    </div>
  `
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
