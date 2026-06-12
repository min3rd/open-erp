import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'oerp-switch',
  standalone: true,
  imports: [NgClass],
  template: `
    <label 
      [ngClass]="[
        'inline-flex items-center gap-3 select-none text-sm font-medium',
        disabled() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      ]"
    >
      <input
        type="checkbox"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onToggle($event)"
        class="sr-only peer"
      />
      <div 
        class="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-colors duration-200 peer-checked:bg-rose-gold-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-rose-gold-400 relative"
      >
        <div 
          class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-full"
        ></div>
      </div>
      @if (label()) {
        <span class="text-slate-700 dark:text-slate-300">{{ label() }}</span>
      }
    </label>
  `
})
export class SwitchComponent {
  label = input<string>('');
  checked = input<boolean>(false);
  disabled = input<boolean>(false);

  checkedChange = output<boolean>();

  onToggle(event: Event): void {
    if (!this.disabled()) {
      const isChecked = (event.target as HTMLInputElement).checked;
      this.checkedChange.emit(isChecked);
    }
  }
}
