import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-input',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, IconComponent],
  template: `
    <div class="flex flex-col w-full gap-1.5">
      <!-- Label -->
      @if (label()) {
        <label
          class="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
        >
          {{ label() }}
        </label>
      }

      <!-- Input Field -->
      <div class="relative rounded-lg shadow-sm flex items-center">
        @if (prefixIcon()) {
          <div class="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <oerp-icon [name]="prefixIcon()!" [size]="18"></oerp-icon>
          </div>
        }
        
        <input
          [type]="type()"
          [placeholder]="placeholder()"
          [formControl]="control()"
          [ngClass]="[
            'block w-full py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
            prefixIcon() ? 'pl-10' : 'px-3.5',
            suffixIcon() ? 'pr-10' : 'pr-3.5',
            hasError() 
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
              : 'border-slate-200 dark:border-slate-700 focus:border-rose-gold-500 focus:ring-1 focus:ring-rose-gold-500'
          ]"
        />

        @if (suffixIcon()) {
          <div class="absolute right-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <oerp-icon [name]="suffixIcon()!" [size]="18"></oerp-icon>
          </div>
        }
      </div>

      <!-- Error Message -->
      @if (hasError()) {
        <span
          class="text-xs font-medium text-red-500 animate-fade-in"
        >
          {{ errorMessage() || 'Thông tin không hợp lệ.' }}
        </span>
      }
    </div>
  `
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
    return ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }
}
