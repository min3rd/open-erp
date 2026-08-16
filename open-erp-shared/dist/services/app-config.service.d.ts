import { AppConfig } from '../models/app-config.model';
export declare const DEFAULT_SHARED_CONFIG: AppConfig;
export declare class AppConfigService {
    private configSignal;
    readonly config: import("@angular/core").Signal<AppConfig>;
    readonly api: import("@angular/core").Signal<import("..").ApiConfig>;
    readonly i18n: import("@angular/core").Signal<import("..").I18nConfig>;
    readonly themes: import("@angular/core").Signal<import("..").ThemeConfig>;
    readonly maintenance: import("@angular/core").Signal<import("..").MaintenanceConfig>;
    readonly systemNotice: import("@angular/core").Signal<import("..").SystemNoticeConfig>;
    loadConfig(configPath?: string): Promise<AppConfig>;
    applyThemePalette(isDark: boolean): void;
}
