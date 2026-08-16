import { Injectable, inject, signal, computed } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AppConfigService } from './app-config.service';
import { LanguageItem } from '../models/app-config.model';

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
    const savedLang = localStorage.getItem('erp_lang') || defaultLang;
    this.setLanguage(savedLang);
  }

  setLanguage(lang: string): void {
    const list = this.configService.i18n().availableLanguages;
    if (list.some(l => l.code === lang)) {
      this.transloco.setActiveLang(lang);
      this.currentLanguage.set(lang);
      localStorage.setItem('erp_lang', lang);
    }
  }

  toggleLanguage(): void {
    const langs = this.configService.i18n().availableLanguages;
    if (langs.length === 0) return;
    const currentIndex = langs.findIndex(l => l.code === this.currentLanguage());
    const nextIndex = (currentIndex + 1) % langs.length;
    this.setLanguage(langs[nextIndex].code);
  }
}
