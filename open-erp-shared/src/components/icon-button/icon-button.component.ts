import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ButtonVariant, ButtonSize } from '../../enums/component.enum';

const VARIANT_CLASSES: Record<string, string> = {
  [ButtonVariant.PRIMARY]: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-600/20 focus:ring-2 focus:ring-indigo-500/40',
  [ButtonVariant.SECONDARY]: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-slate-400/40',
  [ButtonVariant.OUTLINE]: 'border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-400/40',
  [ButtonVariant.DANGER]: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 focus:ring-2 focus:ring-rose-500/40',
  [ButtonVariant.SUCCESS]: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 focus:ring-2 focus:ring-emerald-500/40',
  [ButtonVariant.GHOST]: 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-slate-400/20'
};

const SIZE_CLASSES: Record<string, string> = {
  [ButtonSize.SM]: 'w-8 h-8',
  [ButtonSize.LG]: 'w-12 h-12',
  [ButtonSize.MD]: 'w-10 h-10'
};

const ICON_SIZES: Record<string, number> = {
  [ButtonSize.SM]: 14,
  [ButtonSize.LG]: 20,
  [ButtonSize.MD]: 16
};

@Component({
  selector: 'erp-icon-button',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './icon-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconButtonComponent {
  readonly icon = input<IconName>('plus');
  readonly variant = input<ButtonVariant | 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'>(ButtonVariant.GHOST);
  readonly size = input<ButtonSize | 'sm' | 'md' | 'lg'>(ButtonSize.MD);
  readonly shape = input<'circle' | 'rounded' | 'square'>('rounded');
  readonly tooltip = input<string | undefined>(undefined);
  readonly badge = input<number | string | undefined>(undefined);
  readonly badgeColor = input<string>('bg-rose-500 text-white');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly skeleton = input<boolean>(false);
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly btnClick = output<MouseEvent>();

  readonly variantClass = computed(() => {
    const v = String(this.variant());
    return VARIANT_CLASSES[v] || VARIANT_CLASSES[ButtonVariant.GHOST];
  });

  readonly sizeClass = computed(() => {
    const s = String(this.size());
    return SIZE_CLASSES[s] || SIZE_CLASSES[ButtonSize.MD];
  });

  readonly iconSize = computed(() => {
    const s = String(this.size());
    return ICON_SIZES[s] || ICON_SIZES[ButtonSize.MD];
  });

  readonly shapeClass = computed(() => {
    const shp = this.shape();
    switch (shp) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-none';
      case 'rounded':
      default:
        return String(this.size()) === 'lg' ? 'rounded-2xl' : 'rounded-xl';
    }
  });

  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading() && !this.skeleton()) {
      this.btnClick.emit(event);
    }
  }
}
