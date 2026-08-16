var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, inject, signal, computed } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AppConfigService } from './app-config.service';
import { STORAGE_KEYS } from '../constants/permission.constant';
let LanguageService = class LanguageService {
    transloco = inject(TranslocoService);
    configService = inject(AppConfigService);
    supportedLanguages = computed(() => {
        return this.configService.i18n().availableLanguages;
    });
    currentLanguage = signal('vi');
    constructor() {
        const defaultLang = this.configService.i18n().defaultLanguage || 'vi';
        const savedLang = typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEYS.LANG) || defaultLang) : defaultLang;
        this.setLanguage(savedLang);
    }
    setLanguage(lang) {
        const list = this.configService.i18n().availableLanguages;
        if (list.some((l) => l.code === lang)) {
            this.transloco.setActiveLang(lang);
            this.currentLanguage.set(lang);
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.LANG, lang);
            }
        }
    }
    toggleLanguage() {
        const langs = this.configService.i18n().availableLanguages;
        if (langs.length === 0)
            return;
        const currentIndex = langs.findIndex((l) => l.code === this.currentLanguage());
        const nextIndex = (currentIndex + 1) % langs.length;
        this.setLanguage(langs[nextIndex].code);
    }
};
LanguageService = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __metadata("design:paramtypes", [])
], LanguageService);
export { LanguageService };
//# sourceMappingURL=language.service.js.map