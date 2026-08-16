import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { DividerOrientation } from '../../enums/component.enum';

@Component({
  selector: 'erp-divider',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './divider.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DividerComponent {
  @Input() orientation: DividerOrientation | 'horizontal' | 'vertical' = DividerOrientation.HORIZONTAL;
  @Input() dashed: boolean = false;
  @Input() label?: string;
  @Input() align: 'left' | 'center' | 'right' = 'center';
  @Input() loading: boolean = false;
}
