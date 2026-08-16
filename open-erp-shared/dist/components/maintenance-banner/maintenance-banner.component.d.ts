import { AppConfigService } from '../../services/app-config.service';
export declare class MaintenanceBannerComponent {
    configService: AppConfigService;
    isNoticeDismissed: import("@angular/core").WritableSignal<boolean>;
    isBypassed: import("@angular/core").WritableSignal<boolean>;
    dismissNotice(): void;
    bypassMaintenance(): void;
    reloadPage(): void;
}
