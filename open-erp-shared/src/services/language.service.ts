import { Injectable, inject, signal, computed } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AppConfigService } from './app-config.service';
import { LanguageItem } from '../models/app-config.model';
import { STORAGE_KEYS } from '../constants/permission.constant';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private transloco = inject(TranslocoService);
  private configService = inject(AppConfigService);

  readonly supportedLanguages = computed<LanguageItem[]>(() => {
    return this.configService.i18n().availableLanguages;
  });

  currentLanguage = signal<string>('vi');

  constructor() {
    const defaultLang = this.configService.i18n().defaultLanguage || 'vi';
    const savedLang = typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEYS.LANG) || defaultLang) : defaultLang;
    this.setLanguage(savedLang);
  }

  setLanguage(lang: string): void {
    const list = this.configService.i18n().availableLanguages;
    if (list.some((l: LanguageItem) => l.code === lang)) {
      this.transloco.setActiveLang(lang);
      this.currentLanguage.set(lang);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.LANG, lang);
      }
    }
  }

  toggleLanguage(): void {
    const langs = this.configService.i18n().availableLanguages;
    if (langs.length === 0) return;
    const currentIndex = langs.findIndex((l: LanguageItem) => l.code === this.currentLanguage());
    const nextIndex = (currentIndex + 1) % langs.length;
    this.setLanguage(langs[nextIndex].code);
  }
}
