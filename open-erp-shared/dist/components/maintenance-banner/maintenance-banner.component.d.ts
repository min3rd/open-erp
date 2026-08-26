import { AppConfigService } from '../../services/app-config.service';
export declare class MaintenanceBannerComponent {
    readonly configService: AppConfigService;
    readonly isNoticeDismissed: import("@angular/core").WritableSignal<boolean>;
    readonly isBypassed: import("@angular/core").WritableSignal<boolean>;
    dismissNotice(): void;
    bypassMaintenance(): void;
    reloadPage(): void;
}
