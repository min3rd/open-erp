import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from './avatar.component';
import { AvatarSize, AvatarShape } from '../../enums/component.enum';

export interface AvatarGroupUser {
  name: string;
  imageUrl?: string;
  online?: boolean;
}

@Component({
  selector: 'erp-avatar-group',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './avatar-group.component.html',
  styles: [`
    :host {
      display: inline-flex;
    }
  `]
})
export class AvatarGroupComponent {
  @Input() users: AvatarGroupUser[] = [];
  @Input() max: number = 4;
  @Input() size: AvatarSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl' = AvatarSize.MD;
  @Input() shape: AvatarShape | 'circle' | 'rounded' | 'square' = AvatarShape.CIRCLE;

  get visibleUsers(): AvatarGroupUser[] {
    return this.users.slice(0, this.max);
  }

  get remainingCount(): number {
    return Math.max(0, this.users.length - this.max);
  }

  getSizeClasses(): string {
    const s = String(this.size);
    switch (s) {
      case 'xs':
        return 'w-6 h-6 text-[10px] ring-1';
      case 'sm':
        return 'w-8 h-8 text-xs ring-2';
      case 'lg':
        return 'w-12 h-12 text-sm ring-2';
      case 'xl':
        return 'w-16 h-16 text-base ring-4';
      case 'md':
      default:
        return 'w-10 h-10 text-xs ring-2';
    }
  }

  getShapeClasses(): string {
    const sh = String(this.shape);
    switch (sh) {
      case 'circle':
        return 'rounded-full';
      case 'square':
        return 'rounded-none';
      case 'rounded':
      default:
        return 'rounded-xl';
    }
  }
}
