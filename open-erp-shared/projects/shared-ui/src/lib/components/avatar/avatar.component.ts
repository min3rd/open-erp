import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'oerp-avatar',
  standalone: true,
  imports: [NgClass],
  templateUrl: './avatar.component.html'
})
export class AvatarComponent {
  src = input<string>('');
  name = input<string>('');
  size = input<'sm' | 'md' | 'lg'>('md');

  getSizeClasses(): string {
    switch (this.size()) {
      case 'sm': return 'w-8 h-8 text-xs';
      case 'md': return 'w-10 h-10 text-sm';
      case 'lg': return 'w-16 h-16 text-lg';
      default: return 'w-10 h-10 text-sm';
    }
  }

  getInitials(): string {
    const valName = this.name();
    if (!valName) return 'U';
    const parts = valName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return valName[0].toUpperCase();
  }
}
