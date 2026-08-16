import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarSize, AvatarShape } from '../../enums/component.enum';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'erp-avatar',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './avatar.component.html'
})
export class AvatarComponent {
  @Input() name: string = 'User';
  @Input() size: AvatarSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl' = AvatarSize.MD;
  @Input() shape: AvatarShape | 'circle' | 'rounded' | 'square' = AvatarShape.ROUNDED;
  @Input() online: boolean = false;
  @Input() imageUrl?: string;
  @Input() loading: boolean = false;

  get initial(): string {
    const val = (this.name || 'U').trim();
    return val.length > 0 ? val[0].toUpperCase() : 'U';
  }

  getSizeClasses(): string {
    const s = String(this.size);
    switch (s) {
      case AvatarSize.XS:
      case 'xs':
        return 'w-6 h-6 text-[10px]';
      case AvatarSize.SM:
      case 'sm':
        return 'w-8 h-8 text-xs';
      case AvatarSize.LG:
      case 'lg':
        return 'w-12 h-12 text-lg';
      case AvatarSize.XL:
      case 'xl':
        return 'w-16 h-16 text-2xl';
      case AvatarSize.MD:
      case 'md':
      default:
        return 'w-10 h-10 text-sm';
    }
  }

  getShapeClasses(): string {
    const sh = String(this.shape);
    const sz = String(this.size);
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
  }
}
