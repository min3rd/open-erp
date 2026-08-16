import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'erp-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html'
})
export class SkeletonComponent {
  @Input() width: string = '100%';
  @Input() height: string = '1rem';
  @Input() shape: 'rect' | 'circle' | 'rounded' | 'pill' = 'rounded';
  @Input() className: string = '';

  getShapeClasses(): string {
    switch (this.shape) {
      case 'circle':
        return 'rounded-full';
      case 'pill':
        return 'rounded-full';
      case 'rect':
        return 'rounded-none';
      case 'rounded':
      default:
        return 'rounded-xl';
    }
  }
}
