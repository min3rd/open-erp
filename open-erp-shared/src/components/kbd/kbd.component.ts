import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

const SIZE_CLASSES: Record<string, string> = {
  sm: 'text-[10px] min-w-[1.25rem] h-5 px-1',
  lg: 'text-xs min-w-[2rem] h-7 px-2.5',
  md: 'text-[11px] min-w-[1.5rem] h-6 px-1.5'
};

@Component({
  selector: 'erp-kbd',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kbd.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KbdComponent {
  readonly key = input<string | undefined>(undefined);
  readonly keys = input<string[] | undefined>(undefined);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly keyList = computed(() => {
    const ks = this.keys();
    if (ks && ks.length > 0) return ks;
    const k = this.key();
    if (k) return [k];
    return [];
  });

  readonly sizeClass = computed(() => {
    return SIZE_CLASSES[this.size()] || SIZE_CLASSES['md'];
  });
}
