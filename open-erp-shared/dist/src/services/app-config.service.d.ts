import { AppConfig } from '../models/app-config.model';
export declare const DEFAULT_SHARED_CONFIG: AppConfig;
export declare class AppConfigService {
    private configSignal;
    readonly config: import("@angular/core").Signal<AppConfig>;
    readonly api: import("@angular/core").Signal<import("../models/app-config.model").ApiConfig>;
    readonly i18n: import("@angular/core").Signal<import("../models/app-config.model").I18nConfig>;
    readonly themes: import("@angular/core").Signal<import("../models/app-config.model").ThemeConfig>;
    readonly maintenance: import("@angular/core").Signal<import("../models/app-config.model").MaintenanceConfig>;
    readonly systemNotice: import("@angular/core").Signal<import("../models/app-config.model").SystemNoticeConfig>;
    loadConfig(configPath?: string): Promise<AppConfig>;
    applyThemePalette(isDark: boolean): void;
}
