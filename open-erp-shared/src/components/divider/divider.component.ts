import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { DividerOrientation } from '../../enums/component.enum';

@Component({
  selector: 'erp-divider',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './divider.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DividerComponent {
  readonly orientation = input<DividerOrientation | 'horizontal' | 'vertical'>(DividerOrientation.HORIZONTAL);
  readonly dashed = input<boolean>(false);
  readonly label = input<string | undefined>(undefined);
  readonly align = input<'left' | 'center' | 'right'>('center');
  readonly loading = input<boolean>(false);
}
