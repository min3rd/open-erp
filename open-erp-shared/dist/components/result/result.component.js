var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ResultStatus } from '../../enums/component.enum';
const TITLES = {
    '403': '403 - Quyền truy cập bị từ chối',
    '404': '404 - Không tìm thấy trang',
    '500': '500 - Lỗi máy chủ nội bộ',
    success: 'Thao tác thực hiện thành công',
    warning: 'Có cảnh báo cần lưu ý',
    error: 'Thao tác không thành công',
    info: 'Thông tin hệ thống'
};
const SUBTITLES = {
    '403': 'Bạn không có đặc quyền truy cập tài nguyên này. Vui lòng liên hệ quản trị viên.',
    '404': 'Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ khác.',
    '500': 'Hệ thống máy chủ gặp sự cố ngoài dự kiến. Vui lòng thử lại sau giây lát.',
    success: 'Dữ liệu đã được ghi nhận và lưu trữ thành công trên hệ thống máy chủ đám mây.',
    warning: 'Vui lòng kiểm tra lại các thiết lập hoặc số dư tài khoản trước khi tiếp tục.',
    error: 'Yêu cầu không thể hoàn tất do xung đột dữ liệu hoặc mất kết nối mạng.',
    info: 'Hệ thống ERP đang hoạt động bình thường trên nền tảng đám mây mở.'
};
const ICONS = {
    '403': 'shield-alert',
    '404': 'help-circle',
    '500': 'server',
    success: 'check-circle',
    warning: 'alert-triangle',
    error: 'alert-circle',
    info: 'info'
};
const ICON_COLOR_CLASSES = {
    success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    error: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
    '500': 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
    '403': 'text-purple-500 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
    '404': 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    info: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800'
};
let ResultComponent = class ResultComponent {
    status = input(ResultStatus.INFO);
    title = input(undefined);
    subTitle = input(undefined);
    icon = input(undefined);
    isHttpError = computed(() => {
        const s = String(this.status());
        return s === '403' || s === '404' || s === '500';
    });
    defaultTitle = computed(() => {
        const custom = this.title();
        if (custom)
            return custom;
        const s = String(this.status());
        return TITLES[s] || TITLES['info'];
    });
    defaultSubTitle = computed(() => {
        const custom = this.subTitle();
        if (custom)
            return custom;
        const s = String(this.status());
        return SUBTITLES[s] || SUBTITLES['info'];
    });
    iconName = computed(() => {
        const custom = this.icon();
        if (custom)
            return custom;
        const s = String(this.status());
        return ICONS[s] || 'info';
    });
    iconColorClass = computed(() => {
        const s = String(this.status());
        return ICON_COLOR_CLASSES[s] || ICON_COLOR_CLASSES['info'];
    });
};
ResultComponent = __decorate([
    Component({
        selector: 'erp-result, erp-error-page',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './result.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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