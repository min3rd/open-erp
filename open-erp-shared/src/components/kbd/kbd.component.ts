import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'erp-kbd',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kbd.component.html'
})
export class KbdComponent {
  @Input() key?: string;
  @Input() keys?: string[];
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get keyList(): string[] {
    if (this.keys && this.keys.length > 0) return this.keys;
    if (this.key) return [this.key];
    return [];
  }

  getSizeClasses(): string {
    switch (this.size) {
      case 'sm': return 'text-[10px] min-w-[1.25rem] h-5 px-1';
      case 'lg': return 'text-xs min-w-[2rem] h-7 px-2.5';
      case 'md':
      default: return 'text-[11px] min-w-[1.5rem] h-6 px-1.5';
    }
  }
}
