var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { PaginationVariant } from '../../../enums/component.enum';
let PaginationComponent = class PaginationComponent {
    currentPage = model(1);
    totalItems = input(0);
    pageSize = model(10);
    pageSizeOptions = input([10, 20, 50, 100]);
    showPageSizeSelector = input(true);
    showTotalInfo = input(true);
    showJumpToPage = input(false);
    variant = input(PaginationVariant.FULL);
    loading = input(false);
    pageChange = output();
    jumpPageInput = 1;
    isFull = computed(() => String(this.variant()) === 'full');
    totalPages = computed(() => {
        const size = this.pageSize() || 10;
        return Math.max(1, Math.ceil(this.totalItems() / size));
    });
    startItem = computed(() => {
        const tot = this.totalItems();
        if (tot === 0)
            return 0;
        return (this.currentPage() - 1) * this.pageSize() + 1;
    });
    endItem = computed(() => {
        return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
    });
    pageNumbers = computed(() => {
        const total = this.totalPages();
        const current = this.currentPage();
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        const pages = [];
        if (current <= 4) {
            pages.push(1, 2, 3, 4, 5, '...', total);
        }
        else if (current >= total - 3) {
            pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
        }
        else {
            pages.push(1, '...', current - 1, current, current + 1, '...', total);
        }
        return pages;
    });
    setPage(page) {
        if (typeof page === 'string')
            return;
        const max = this.totalPages();
        if (page < 1 || page > max || page === this.currentPage())
            return;
        this.currentPage.set(page);
        this.pageChange.emit(page);
    }
    onPageSizeChange(event) {
        const select = event.target;
        const newSize = parseInt(select.value, 10);
        this.pageSize.set(newSize);
        this.currentPage.set(1);
        this.pageChange.emit(1);
    }
    onJumpPage() {
        if (this.jumpPageInput >= 1 && this.jumpPageInput <= this.totalPages()) {
            this.setPage(this.jumpPageInput);
        }
    }
};
PaginationComponent = __decorate([
    Component({
        selector: 'erp-pagination',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent],
        templateUrl: './pagination.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], PaginationComponent);
export { PaginationComponent };
//# sourceMappingURL=pagination.component.js.map