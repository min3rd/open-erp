var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ResultStatus } from '../../enums/component.enum';
let ResultComponent = class ResultComponent {
    status = ResultStatus.INFO;
    title;
    subTitle;
    icon;
    get isHttpError() {
        return this.status === '403' || this.status === '404' || this.status === '500';
    }
    get defaultTitle() {
        if (this.title)
            return this.title;
        switch (this.status) {
            case '403':
                return '403 - Quyền truy cập bị từ chối';
            case '404':
                return '404 - Không tìm thấy trang';
            case '500':
                return '500 - Lỗi máy chủ nội bộ';
            case 'success':
                return 'Thao tác thực hiện thành công';
            case 'warning':
                return 'Có cảnh báo cần lưu ý';
            case 'error':
                return 'Thao tác không thành công';
            case 'info':
            default:
                return 'Thông tin hệ thống';
        }
    }
    get defaultSubTitle() {
        if (this.subTitle)
            return this.subTitle;
        switch (this.status) {
            case '403':
                return 'Bạn không có đặc quyền truy cập tài nguyên này. Vui lòng liên hệ quản trị viên.';
            case '404':
                return 'Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ khác.';
            case '500':
                return 'Hệ thống máy chủ gặp sự cố ngoài dự kiến. Vui lòng thử lại sau giây lát.';
            case 'success':
                return 'Dữ liệu đã được ghi nhận và lưu trữ thành công trên hệ thống máy chủ đám mây.';
            case 'warning':
                return 'Vui lòng kiểm tra lại các thiết lập hoặc số dư tài khoản trước khi tiếp tục.';
            case 'error':
                return 'Yêu cầu không thể hoàn tất do xung đột dữ liệu hoặc mất kết nối mạng.';
            case 'info':
            default:
                return 'Hệ thống ERP đang hoạt động bình thường trên nền tảng đám mây mở.';
        }
    }
    get iconName() {
        if (this.icon)
            return this.icon;
        switch (this.status) {
            case '403':
                return 'shield-alert';
            case '404':
                return 'help-circle';
            case '500':
                return 'server';
            case 'success':
                return 'check-circle';
            case 'warning':
                return 'alert-triangle';
            case 'error':
                return 'alert-circle';
            case 'info':
            default:
                return 'info';
        }
    }
    get iconColorClass() {
        switch (this.status) {
            case 'success':
                return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
            case 'warning':
                return 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
            case 'error':
            case '500':
                return 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800';
            case '403':
                return 'text-purple-500 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800';
            case '404':
            case 'info':
            default:
                return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], ResultComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ResultComponent.prototype, "title", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ResultComponent.prototype, "subTitle", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], ResultComponent.prototype, "icon", void 0);
ResultComponent = __decorate([
    Component({
        selector: 'erp-result, erp-error-page',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './result.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], ResultComponent);
export { ResultComponent };
//# sourceMappingURL=result.component.js.map