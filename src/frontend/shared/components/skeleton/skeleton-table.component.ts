import { Component, computed, input } from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton.component';

const CELL_WIDTHS = ['90%', '70%', '80%', '55%', '65%'];

/**
 * Table-shaped skeleton that mirrors the shared `app-table` chrome (border,
 * header band, cell padding) so the real rows do not shift the layout in.
 */
@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [SkeletonComponent],
  templateUrl: './skeleton-table.component.html'
})
export class SkeletonTableComponent {
  rows = input<number>(5);
  columns = input<number>(4);

  readonly rowIndexes = computed(() =>
    Array.from({ length: Math.max(0, this.rows()) }, (_, index) => index)
  );
  readonly columnIndexes = computed(() =>
    Array.from({ length: Math.max(0, this.columns()) }, (_, index) => index)
  );

  cellWidth(column: number): string {
    return CELL_WIDTHS[column % CELL_WIDTHS.length];
  }
}
