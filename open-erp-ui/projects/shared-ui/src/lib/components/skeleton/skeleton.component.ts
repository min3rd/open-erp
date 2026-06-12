import { Component, input } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

@Component({
  selector: 'oerp-skeleton',
  standalone: true,
  imports: [NgClass, NgStyle],
  template: `
    <div 
      [ngClass]="[
        'animate-pulse bg-slate-200 dark:bg-slate-700',
        getShapeClass()
      ]"
      [ngStyle]="{
        'width': width(),
        'height': height()
      }"
    ></div>
  `
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
