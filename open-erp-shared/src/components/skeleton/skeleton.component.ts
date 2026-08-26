import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

const SHAPE_CLASSES: Record<string, string> = {
  circle: 'rounded-full',
  pill: 'rounded-full',
  rect: 'rounded-none',
  rounded: 'rounded-xl'
};

@Component({
  selector: 'erp-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
  readonly shape = input<'rect' | 'circle' | 'rounded' | 'pill'>('rounded');
  readonly className = input<string>('');

  readonly shapeClass = computed(() => {
    return SHAPE_CLASSES[this.shape()] || SHAPE_CLASSES['rounded'];
  });
}
