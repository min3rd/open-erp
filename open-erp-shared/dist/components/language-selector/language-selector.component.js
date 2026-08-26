var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { IconComponent } from '../icon/icon.component';
let LanguageSelectorComponent = class LanguageSelectorComponent {
    langService = inject(LanguageService);
    isOpen = signal(false);
    currentLanguageItem = computed(() => {
        return this.langService.supportedLanguages().find((l) => l.code === this.langService.currentLanguage());
    });
    currentLabel = computed(() => {
        return this.currentLanguageItem()?.name || this.langService.currentLanguage().toUpperCase();
    });
    currentCode = computed(() => {
        return (this.langService.currentLanguage() || 'VI').toUpperCase();
    });
    toggleDropdown() {
        this.isOpen.update(v => !v);
    }
    selectLanguage(langCode) {
        this.langService.setLanguage(langCode);
        this.isOpen.set(false);
    }
};
LanguageSelectorComponent = __decorate([
    Component({
        selector: 'erp-language-selector',
        standalone: true,
        imports: [CommonModule, IconComponent],
        templateUrl: './language-selector.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush
    })
], LanguageSelectorComponent);
export { LanguageSelectorComponent };
//# sourceMappingURL=language-selector.component.js.map