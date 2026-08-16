import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerSize, SpinnerVariant } from '../../enums/component.enum';

@Component({
  selector: 'erp-spinner, erp-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html'
})
export class SpinnerComponent {
  @Input() size: SpinnerSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl' = SpinnerSize.MD;
  @Input() variant: SpinnerVariant | 'spin' | 'dots' | 'pulse' = SpinnerVariant.SPIN;
  @Input() color: string = 'text-indigo-600 dark:text-indigo-400';
  @Input() label?: string;

  getSizeClasses(): string {
    const s = String(this.size);
    switch (s) {
      case 'xs': return 'w-3 h-3';
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-8 h-8';
      case 'xl': return 'w-12 h-12';
      case 'md':
      default: return 'w-6 h-6';
    }
  }

  getDotSizeClasses(): string {
    const s = String(this.size);
    switch (s) {
      case 'xs': return 'w-1 h-1';
      case 'sm': return 'w-1.5 h-1.5';
      case 'lg': return 'w-3 h-3';
      case 'xl': return 'w-4 h-4';
      case 'md':
      default: return 'w-2 h-2';
    }
  }
}
