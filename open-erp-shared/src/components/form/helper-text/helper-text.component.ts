import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { ValidationStatus } from '../../../enums/component.enum';

const TEXT_CLASSES: Record<string, string> = {
  [ValidationStatus.INVALID]: 'text-rose-500 dark:text-rose-400',
  [ValidationStatus.VALID]: 'text-emerald-600 dark:text-emerald-400',
  [ValidationStatus.WARNING]: 'text-amber-600 dark:text-amber-400',
  [ValidationStatus.NONE]: 'text-slate-400 dark:text-slate-500'
};

const ICONS: Record<string, string> = {
  [ValidationStatus.INVALID]: 'alert-circle',
  [ValidationStatus.VALID]: 'check-circle',
  [ValidationStatus.WARNING]: 'alert-triangle'
};

@Component({
  selector: 'erp-helper-text',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './helper-text.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelperTextComponent {
  readonly text = input<string>('');
  readonly status = input<ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'>(ValidationStatus.NONE);

  readonly textClass = computed(() => {
    const st = String(this.status());
    return TEXT_CLASSES[st] || TEXT_CLASSES[ValidationStatus.NONE];
  });

  readonly iconName = computed(() => {
    const st = String(this.status());
    return ICONS[st] || 'info';
  });
}
