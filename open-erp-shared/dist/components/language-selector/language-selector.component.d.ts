import { LanguageService } from '../../services/language.service';
import { LanguageItem } from '../../models/app-config.model';
export declare class LanguageSelectorComponent {
    langService: LanguageService;
    isOpen: import("@angular/core").WritableSignal<boolean>;
    toggleDropdown(): void;
    selectLanguage(langCode: string): void;
    currentLanguageItem(): LanguageItem | undefined;
    currentLabel(): string;
    currentCode(): string;
}
