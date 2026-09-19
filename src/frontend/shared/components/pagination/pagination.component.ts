import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './pagination.component.html'
})
export class PaginationComponent {
  page = input<number>(0);
  size = input<number>(20);
  totalItems = input<number>(0);
  totalPages = input<number>(0);

  pageChange = output<number>();

  readonly canPrev = computed(() => this.page() > 0);
  readonly canNext = computed(() => this.page() + 1 < Math.max(this.totalPages(), 1));
  readonly displayPage = computed(() => Math.min(this.page() + 1, Math.max(this.totalPages(), 1)));

  prev() {
    if (this.canPrev()) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  next() {
    if (this.canNext()) {
      this.pageChange.emit(this.page() + 1);
    }
  }
}
