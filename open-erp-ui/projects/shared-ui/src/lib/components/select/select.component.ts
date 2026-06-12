import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-select',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, IconComponent],
  template: `
    <div class="flex flex-col w-full gap-1.5">
      @if (label()) {
        <label class="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {{ label() }}
        </label>
      }

      <div class="relative">
        <select
          [formControl]="control()"
          [ngClass]="[
            'block w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 appearance-none',
            hasError()
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-slate-200 dark:border-slate-700 focus:border-rose-gold-500 focus:ring-1 focus:ring-rose-gold-500'
          ]"
        >
          @if (placeholder()) {
            <option value="" disabled selected hidden>{{ placeholder() }}</option>
          }
          @for (option of options(); track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
        
        <!-- Arrow custom icon -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 dark:text-slate-400">
          <oerp-icon name="chevron-down" [size]="16" class="flex items-center"></oerp-icon>
        </div>
      </div>

      @if (hasError()) {
        <span class="text-xs font-medium text-red-500 animate-fade-in">
          {{ errorMessage() || 'Thông tin không hợp lệ.' }}
        </span>
      }
    </div>
  `
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
