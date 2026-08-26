import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerSize, SpinnerVariant } from '../../enums/component.enum';

const SIZE_CLASSES: Record<string, string> = {
  [SpinnerSize.XS]: 'w-3 h-3',
  [SpinnerSize.SM]: 'w-4 h-4',
  [SpinnerSize.LG]: 'w-8 h-8',
  [SpinnerSize.XL]: 'w-12 h-12',
  [SpinnerSize.MD]: 'w-6 h-6'
};

const DOT_SIZE_CLASSES: Record<string, string> = {
  [SpinnerSize.XS]: 'w-1 h-1',
  [SpinnerSize.SM]: 'w-1.5 h-1.5',
  [SpinnerSize.LG]: 'w-3 h-3',
  [SpinnerSize.XL]: 'w-4 h-4',
  [SpinnerSize.MD]: 'w-2 h-2'
};

@Component({
  selector: 'erp-spinner, erp-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {
  readonly size = input<SpinnerSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>(SpinnerSize.MD);
  readonly variant = input<SpinnerVariant | 'spin' | 'dots' | 'pulse'>(SpinnerVariant.SPIN);
  readonly color = input<string>('text-indigo-600 dark:text-indigo-400');
  readonly label = input<string | undefined>(undefined);

  readonly sizeClass = computed(() => {
    const s = String(this.size());
    return SIZE_CLASSES[s] || SIZE_CLASSES[SpinnerSize.MD];
  });

  readonly dotSizeClass = computed(() => {
    const s = String(this.size());
    return DOT_SIZE_CLASSES[s] || DOT_SIZE_CLASSES[SpinnerSize.MD];
  });
}
