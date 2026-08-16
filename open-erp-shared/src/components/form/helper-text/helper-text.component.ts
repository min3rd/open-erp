import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { ValidationStatus } from '../../../enums/component.enum';

@Component({
  selector: 'erp-helper-text',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './helper-text.component.html'
})
export class HelperTextComponent {
  @Input() text: string = '';
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;

  getTextClasses(): string {
    const st = String(this.status);
    switch (st) {
      case ValidationStatus.INVALID:
      case 'invalid':
        return 'text-rose-500 dark:text-rose-400';
      case ValidationStatus.VALID:
      case 'valid':
        return 'text-emerald-600 dark:text-emerald-400';
      case ValidationStatus.WARNING:
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case ValidationStatus.NONE:
      case 'none':
      default:
        return 'text-slate-400 dark:text-slate-500';
    }
  }

  getIconName(): string {
    const st = String(this.status);
    switch (st) {
      case ValidationStatus.INVALID:
      case 'invalid':
        return 'alert-circle';
      case ValidationStatus.VALID:
      case 'valid':
        return 'check-circle';
      case ValidationStatus.WARNING:
      case 'warning':
        return 'alert-triangle';
      default:
        return 'info';
    }
  }
}
