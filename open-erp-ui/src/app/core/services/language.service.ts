import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private transloco = inject(TranslocoService);

  readonly supportedLanguages: SupportedLanguage[] = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  currentLanguage = signal<string>('vi');

  constructor() {
    const savedLang = localStorage.getItem('erp_lang') || 'vi';
    this.setLanguage(savedLang);
  }

  setLanguage(lang: string): void {
    if (this.supportedLanguages.some(l => l.code === lang)) {
      this.transloco.setActiveLang(lang);
      this.currentLanguage.set(lang);
      localStorage.setItem('erp_lang', lang);
    }
  }

  toggleLanguage(): void {
    const nextLang = this.currentLanguage() === 'vi' ? 'en' : 'vi';
    this.setLanguage(nextLang);
  }
}
