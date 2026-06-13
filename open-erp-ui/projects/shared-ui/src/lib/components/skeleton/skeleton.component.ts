import { Component, input } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

@Component({
  selector: 'oerp-skeleton',
  standalone: true,
  imports: [NgClass, NgStyle],
  templateUrl: './skeleton.component.html'
})
export class SkeletonComponent {
  width = input<string>('100%');
  height = input<string>('16px');
  shape = input<'line' | 'circle' | 'rect'>('line');

  getShapeClass(): string {
    switch (this.shape()) {
      case 'circle': return 'rounded-full';
      case 'rect': return 'rounded-xl';
      case 'line':
      default: return 'rounded';
    }
  }
}
