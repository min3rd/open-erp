import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from './avatar.component';
import { AvatarSize, AvatarShape } from '../../enums/component.enum';

export interface AvatarGroupUser {
  name: string;
  imageUrl?: string;
  online?: boolean;
}

const GROUP_SIZE_CLASSES: Record<string, string> = {
  [AvatarSize.XS]: 'w-6 h-6 text-[10px] ring-1',
  [AvatarSize.SM]: 'w-8 h-8 text-xs ring-2',
  [AvatarSize.LG]: 'w-12 h-12 text-sm ring-2',
  [AvatarSize.XL]: 'w-16 h-16 text-base ring-4',
  [AvatarSize.MD]: 'w-10 h-10 text-xs ring-2'
};

@Component({
  selector: 'erp-avatar-group',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './avatar-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: inline-flex;
    }
  `]
})
export class AvatarGroupComponent {
  readonly users = input<AvatarGroupUser[]>([]);
  readonly max = input<number>(4);
  readonly size = input<AvatarSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>(AvatarSize.MD);
  readonly shape = input<AvatarShape | 'circle' | 'rounded' | 'square'>(AvatarShape.CIRCLE);

  readonly visibleUsers = computed<AvatarGroupUser[]>(() => {
    return this.users().slice(0, this.max());
  });

  readonly remainingCount = computed<number>(() => {
    return Math.max(0, this.users().length - this.max());
  });

  readonly sizeClass = computed(() => {
    const s = String(this.size());
    return GROUP_SIZE_CLASSES[s] || GROUP_SIZE_CLASSES[AvatarSize.MD];
  });

  readonly shapeClass = computed(() => {
    const sh = String(this.shape());
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
        return 'rounded-xl';
    }
  });
}
