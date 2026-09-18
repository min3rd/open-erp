import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLangSignal = signal<'vi' | 'en'>('vi');
  public currentLang = computed(() => this.currentLangSignal());
  private dictVersionSignal = signal<number>(0);

  private viDictionary: Record<string, string> = {};
  private enDictionary: Record<string, string> = {};
  public isLoaded = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem('openerp_lang') as 'vi' | 'en' | null;
    if (saved === 'vi' || saved === 'en') {
      this.currentLangSignal.set(saved);
    }
    this.loadDictionaries();
  }

  async loadDictionaries() {
    try {
      const [viRes, enRes] = await Promise.all([
        fetch('/i18n/vi.json'),
        fetch('/i18n/en.json')
      ]);
      if (viRes.ok) this.viDictionary = await viRes.json();
      if (enRes.ok) this.enDictionary = await enRes.json();
      this.isLoaded.set(true);
      this.dictVersionSignal.update((v: number) => v + 1);
    } catch (e) {
      console.warn('Could not load i18n JSON files, using fallback defaults', e);
    }
  }

  setLanguage(lang: 'vi' | 'en') {
    this.currentLangSignal.set(lang);
    localStorage.setItem('openerp_lang', lang);
    this.dictVersionSignal.update((v: number) => v + 1);
  }

  t(code: string, params?: Record<string, any>): string {
    // Read reactive signal to track dependency in effects and computed values
    this.currentLangSignal();
    this.dictVersionSignal();

    const lang = this.currentLangSignal();
    const dict = lang === 'vi' ? this.viDictionary : this.enDictionary;

    let text = dict[code];
    if (!text) {
      text = this.viDictionary[code] || this.enDictionary[code] || code;
    }

    if (params) {
      for (const [key, val] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
      }
    }

    return text;
  }
}
