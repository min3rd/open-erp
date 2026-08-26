import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { AlertVariant } from '../../enums/component.enum';

const DEFAULT_ICONS: Record<string, IconName> = {
  [AlertVariant.SUCCESS]: 'check-circle',
  [AlertVariant.WARNING]: 'alert-triangle',
  [AlertVariant.ERROR]: 'alert-circle',
  [AlertVariant.NEUTRAL]: 'info',
  [AlertVariant.INFO]: 'info'
};

const VARIANT_CONTAINER_CLASSES: Record<string, string> = {
  [AlertVariant.SUCCESS]: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
  [AlertVariant.WARNING]: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
  [AlertVariant.ERROR]: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200',
  [AlertVariant.NEUTRAL]: 'bg-slate-100/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200',
  [AlertVariant.INFO]: 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'
};

const VARIANT_ICON_CLASSES: Record<string, string> = {
  [AlertVariant.SUCCESS]: 'text-emerald-600 dark:text-emerald-400',
  [AlertVariant.WARNING]: 'text-amber-600 dark:text-amber-400',
  [AlertVariant.ERROR]: 'text-rose-600 dark:text-rose-400',
  [AlertVariant.NEUTRAL]: 'text-slate-600 dark:text-slate-400',
  [AlertVariant.INFO]: 'text-indigo-600 dark:text-indigo-400'
};

@Component({
  selector: 'erp-alert, erp-banner',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './alert.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class AlertComponent {
  readonly variant = input<AlertVariant | 'info' | 'success' | 'warning' | 'error' | 'neutral'>(AlertVariant.INFO);
  readonly title = input<string | undefined>(undefined);
  readonly message = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly showIcon = input<boolean>(true);
  readonly closable = input<boolean>(false);
  readonly banner = input<boolean>(false);
  readonly bordered = input<boolean>(true);

  readonly closed = output<void>();

  visible = signal<boolean>(true);

  readonly defaultIcon = computed<IconName>(() => {
    const custom = this.icon();
    if (custom) return custom;
    const v = String(this.variant());
    return DEFAULT_ICONS[v] || 'info';
  });

  readonly containerClasses = computed(() => {
    const base = 'relative transition-all duration-200';
    const shape = this.banner() ? 'rounded-none px-6 py-3.5' : 'rounded-2xl p-4';
    const border = this.bordered() ? 'border' : 'border-0';
    const v = String(this.variant());
    const variantCls = VARIANT_CONTAINER_CLASSES[v] || VARIANT_CONTAINER_CLASSES[AlertVariant.INFO];

    return `${base} ${shape} ${border} ${variantCls}`;
  });

  readonly iconClasses = computed(() => {
    const v = String(this.variant());
    return VARIANT_ICON_CLASSES[v] || VARIANT_ICON_CLASSES[AlertVariant.INFO];
  });

  close(): void {
    this.visible.set(false);
    this.closed.emit();
  }
}
