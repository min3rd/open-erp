import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-button',
  standalone: true,
  imports: [NgClass, IconComponent],
  templateUrl: './button.component.html'
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
        return 'rose-gold-gradient starry-night text-white focus:ring-rose-gold-400';
      case 'secondary':
        return 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-slate-400';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      default:
        return '';
    }
  }
}
