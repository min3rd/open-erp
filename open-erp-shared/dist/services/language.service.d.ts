import { LanguageItem } from '../models/app-config.model';
export declare class LanguageService {
    private transloco;
    private configService;
    readonly supportedLanguages: import("@angular/core").Signal<LanguageItem[]>;
    currentLanguage: import("@angular/core").WritableSignal<string>;
    constructor();
    setLanguage(lang: string): void;
    toggleLanguage(): void;
}
