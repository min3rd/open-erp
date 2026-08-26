import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { ButtonVariant, ButtonSize } from '../../enums/component.enum';

const VARIANT_CLASSES: Record<string, string> = {
  [ButtonVariant.SECONDARY]: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
  [ButtonVariant.OUTLINE]: 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
  [ButtonVariant.DANGER]: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20',
  [ButtonVariant.GHOST]: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
  [ButtonVariant.SUCCESS]: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20',
  [ButtonVariant.PRIMARY]: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20'
};

const SIZE_CLASSES: Record<string, string> = {
  [ButtonSize.SM]: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  [ButtonSize.LG]: 'px-6 py-3 text-sm rounded-2xl gap-2.5 font-bold',
  [ButtonSize.MD]: 'px-4 py-2.5 text-xs rounded-xl gap-2 font-semibold'
};

@Component({
  selector: 'erp-button',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant | 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'>(ButtonVariant.PRIMARY);
  readonly size = input<ButtonSize | 'sm' | 'md' | 'lg'>(ButtonSize.MD);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly skeleton = input<boolean>(false);
  readonly iconLeft = input<IconName | undefined>(undefined);
  readonly iconRight = input<IconName | undefined>(undefined);
  readonly fullWidth = input<boolean>(false);

  readonly btnClick = output<MouseEvent>();

  readonly buttonClasses = computed(() => {
    const v = String(this.variant());
    const s = String(this.size());
    const variantCls = VARIANT_CLASSES[v] || VARIANT_CLASSES[ButtonVariant.PRIMARY];
    const sizeCls = SIZE_CLASSES[s] || SIZE_CLASSES[ButtonSize.MD];
    const widthCls = this.fullWidth() ? ' w-full' : '';
    const stateCls = (this.disabled() || this.loading())
      ? ' opacity-50 cursor-not-allowed'
      : ' cursor-pointer active:scale-98';

    return `inline-flex items-center justify-center transition-all duration-150 select-none ${variantCls} ${sizeCls}${widthCls}${stateCls}`;
  });

  readonly iconSize = computed(() => {
    const s = String(this.size());
    return s === 'sm' ? 12 : (s === 'lg' ? 18 : 14);
  });

  readonly skeletonHeight = computed(() => {
    const s = String(this.size());
    return s === 'sm' ? '2rem' : (s === 'lg' ? '2.75rem' : '2.375rem');
  });

  readonly skeletonClass = computed(() => {
    return String(this.size()) === 'lg' ? 'rounded-2xl' : 'rounded-xl';
  });

  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading() && !this.skeleton()) {
      this.btnClick.emit(event);
    }
  }
}
