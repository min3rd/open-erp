import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarSize, AvatarShape } from '../../enums/component.enum';
import { SkeletonComponent } from '../skeleton/skeleton.component';

const SIZE_CLASSES: Record<string, string> = {
  [AvatarSize.XS]: 'w-6 h-6 text-[10px]',
  [AvatarSize.SM]: 'w-8 h-8 text-xs',
  [AvatarSize.LG]: 'w-12 h-12 text-lg',
  [AvatarSize.XL]: 'w-16 h-16 text-2xl',
  [AvatarSize.MD]: 'w-10 h-10 text-sm'
};

@Component({
  selector: 'erp-avatar',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent {
  readonly name = input<string>('User');
  readonly size = input<AvatarSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>(AvatarSize.MD);
  readonly shape = input<AvatarShape | 'circle' | 'rounded' | 'square'>(AvatarShape.ROUNDED);
  readonly online = input<boolean>(false);
  readonly imageUrl = input<string | undefined>(undefined);
  readonly loading = input<boolean>(false);

  readonly initial = computed(() => {
    const val = (this.name() || 'U').trim();
    return val.length > 0 ? val[0].toUpperCase() : 'U';
  });

  readonly sizeClass = computed(() => {
    const s = String(this.size());
    return SIZE_CLASSES[s] || SIZE_CLASSES[AvatarSize.MD];
  });

  readonly shapeClass = computed(() => {
    const sh = String(this.shape());
    const sz = String(this.size());
    switch (sh) {
      case AvatarShape.CIRCLE:
      case 'circle':
        return 'rounded-full';
      case AvatarShape.SQUARE:
      case 'square':
        return 'rounded-none';
      case AvatarShape.ROUNDED:
      case 'rounded':
      default:
        return sz === AvatarSize.XL || sz === 'xl' ? 'rounded-2xl' : 'rounded-xl';
    }
  });
}
