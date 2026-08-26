var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { AppConfigService } from '../../services/app-config.service';
import { IconComponent } from '../icon/icon.component';
let MaintenanceBannerComponent = class MaintenanceBannerComponent {
    configService = inject(AppConfigService);
    isNoticeDismissed = signal(false);
    isBypassed = signal(false);
    dismissNotice() {
        this.isNoticeDismissed.set(true);
    }
    bypassMaintenance() {
        this.isBypassed.set(true);
    }
    reloadPage() {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }
};
MaintenanceBannerComponent = __decorate([
    Component({
        selector: 'erp-maintenance-banner',
        standalone: true,
        imports: [CommonModule, TranslocoModule, IconComponent],
        templateUrl: './maintenance-banner.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], MaintenanceBannerComponent);
export { MaintenanceBannerComponent };
//# sourceMappingURL=maintenance-banner.component.js.map