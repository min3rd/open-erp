var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { PaginationVariant } from '../../../enums/component.enum';
let PaginationComponent = class PaginationComponent {
    currentPage = 1;
    totalItems = 0;
    pageSize = 10;
    pageSizeOptions = [10, 20, 50, 100];
    showPageSizeSelector = true;
    showTotalInfo = true;
    showJumpToPage = false;
    variant = PaginationVariant.FULL;
    loading = false;
    pageChange = new EventEmitter();
    pageSizeChange = new EventEmitter();
    jumpPageInput = 1;
    get isFull() {
        return String(this.variant) === 'full';
    }
    get totalPages() {
        return Math.max(1, Math.ceil(this.totalItems / (this.pageSize || 10)));
    }
    get startItem() {
        if (this.totalItems === 0)
            return 0;
        return (this.currentPage - 1) * this.pageSize + 1;
    }
    get endItem() {
        return Math.min(this.currentPage * this.pageSize, this.totalItems);
    }
    get pageNumbers() {
        const total = this.totalPages;
        const current = this.currentPage;
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
    }
    setPage(page) {
        if (typeof page === 'string')
            return;
        if (page < 1 || page > this.totalPages || page === this.currentPage)
            return;
        this.currentPage = page;
        this.pageChange.emit(this.currentPage);
    }
    onPageSizeChange(event) {
        const select = event.target;
        const newSize = parseInt(select.value, 10);
        this.pageSize = newSize;
        this.currentPage = 1;
        this.pageSizeChange.emit(newSize);
        this.pageChange.emit(1);
    }
    onJumpPage() {
        if (this.jumpPageInput >= 1 && this.jumpPageInput <= this.totalPages) {
            this.setPage(this.jumpPageInput);
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Number)
], PaginationComponent.prototype, "currentPage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], PaginationComponent.prototype, "totalItems", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], PaginationComponent.prototype, "pageSize", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], PaginationComponent.prototype, "pageSizeOptions", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], PaginationComponent.prototype, "showPageSizeSelector", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], PaginationComponent.prototype, "showTotalInfo", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], PaginationComponent.prototype, "showJumpToPage", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], PaginationComponent.prototype, "variant", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], PaginationComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], PaginationComponent.prototype, "pageChange", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], PaginationComponent.prototype, "pageSizeChange", void 0);
PaginationComponent = __decorate([
    Component({
        selector: 'erp-pagination',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent],
        templateUrl: './pagination.component.html',
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