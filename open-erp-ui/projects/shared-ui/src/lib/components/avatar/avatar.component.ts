import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'oerp-avatar',
  standalone: true,
  imports: [NgClass],
  template: `
    <div 
      [ngClass]="[
        'flex items-center justify-center rounded-full overflow-hidden font-bold select-none border border-slate-200 dark:border-slate-700 bg-rose-gold-50 text-rose-gold-600 dark:bg-rose-gold-900/30 dark:text-rose-gold-400',
        getSizeClasses()
      ]"
    >
      @if (src()) {
        <img [src]="src()" [alt]="name()" class="w-full h-full object-cover" />
      } @else {
        <span>{{ getInitials() }}</span>
      }
    </div>
  `
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
