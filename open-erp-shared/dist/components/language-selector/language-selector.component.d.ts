import { LanguageService } from '../../services/language.service';
import { LanguageItem } from '../../models/app-config.model';
export declare class LanguageSelectorComponent {
    readonly langService: LanguageService;
    readonly isOpen: import("@angular/core").WritableSignal<boolean>;
    readonly currentLanguageItem: import("@angular/core").Signal<LanguageItem | undefined>;
    readonly currentLabel: import("@angular/core").Signal<string>;
    readonly currentCode: import("@angular/core").Signal<string>;
    toggleDropdown(): void;
    selectLanguage(langCode: string): void;
}
