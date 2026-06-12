import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-button',
  standalone: true,
  imports: [NgClass, IconComponent],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || isLoading()"
      (click)="onClick.emit($event)"
      [ngClass]="[
        'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2',
        getVariantClasses(),
        (disabled() || isLoading()) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'
      ]"
    >
      <!-- Loading Spinner -->
      @if (isLoading()) {
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      } @else if (icon()) {
        <oerp-icon [name]="icon()!" [size]="16" class="-ml-1 mr-2"></oerp-icon>
      }
      
      <span class="truncate">{{ label() }}</span>
    </button>
  `
})
export class ButtonComponent {
  label = input<string>('');
  type = input<'button' | 'submit' | 'reset'>('button');
  variant = input<'primary' | 'secondary' | 'danger'>('primary');
  disabled = input<boolean>(false);
  isLoading = input<boolean>(false);
  icon = input<string | undefined>(undefined);

  onClick = output<MouseEvent>();

  getVariantClasses(): string {
    switch (this.variant()) {
      case 'primary':
        // Màu Hồng Vàng (Rose Gold) chủ đạo: #B76E79
        return 'bg-rose-gold-500 hover:bg-rose-gold-600 dark:bg-rose-gold-500 dark:hover:bg-rose-gold-600 text-white focus:ring-rose-gold-400';
      case 'secondary':
        return 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-slate-400';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      default:
        return '';
    }
  }
}
