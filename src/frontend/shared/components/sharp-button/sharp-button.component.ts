import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorVariant, SizeVariant, ButtonType, ButtonVariant, ButtonSize } from '../../enums';

@Component({
  selector: 'app-sharp-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sharp-button.component.html'
})
export class SharpButtonComponent {
  type = input<ButtonType | 'button' | 'submit' | 'reset'>(ButtonType.BUTTON);
  variant = input<ColorVariant | ButtonVariant | 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'>(ColorVariant.PRIMARY);
  size = input<SizeVariant | ButtonSize | 'sm' | 'md' | 'lg'>(SizeVariant.MD);
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  fullWidth = input<boolean>(false);

  clicked = output<MouseEvent>();

  onClick(event: MouseEvent) {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }

  buttonClasses(): string {
    const base = 'inline-flex items-center justify-center font-medium transition-colors select-none rounded-none focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    let sizeCls = 'px-3 py-1.5 text-xs';
    if (this.size() === SizeVariant.SM || (this.size() as string) === 'sm') {
      sizeCls = 'px-2 py-1 text-[11px]';
    } else if (this.size() === SizeVariant.LG || (this.size() as string) === 'lg') {
      sizeCls = 'px-4 py-2 text-sm';
    }

    let variantCls = '';
    const v = this.variant() as string;
    switch (v) {
      case ColorVariant.PRIMARY:
      case 'primary':
        variantCls = 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 border border-transparent';
        break;
      case ColorVariant.SECONDARY:
      case 'secondary':
        variantCls = 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700';
        break;
      case ColorVariant.OUTLINE:
      case 'outline':
        variantCls = 'bg-transparent text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700';
        break;
      case ColorVariant.DANGER:
      case 'danger':
        variantCls = 'bg-red-600 text-white hover:bg-red-700 border border-transparent';
        break;
      case ColorVariant.GHOST:
      case 'ghost':
        variantCls = 'bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 border border-transparent';
        break;
    }

    const widthCls = this.fullWidth() ? 'w-full' : '';

    return `${base} ${sizeCls} ${variantCls} ${widthCls}`.trim();
  }
}
