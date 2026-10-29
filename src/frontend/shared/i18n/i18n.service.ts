import { Injectable, signal, computed } from '@angular/core';
import { LangCode } from '../enums/lang.enum';
import { DEFAULT_LANG, FALLBACK_LANG, findLanguage, isLangCode } from './language-registry';

const LANG_STORAGE_KEY = 'openerp_lang';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLangSignal = signal<LangCode>(this.readStoredLang());
  public currentLang = computed(() => this.currentLangSignal());
  private dictVersionSignal = signal<number>(0);

  private dictionaries = new Map<LangCode, Record<string, string>>();
  private loading = new Map<LangCode, Promise<void>>();
  public isLoaded = signal<boolean>(false);

  constructor() {
    this.applyDocumentLanguage();
    this.loadDictionaries();
  }

  /** Loads the fallback + current locale; other locales load lazily on switch. */
  async loadDictionaries() {
    await Promise.all([this.ensureDictionary(FALLBACK_LANG), this.ensureDictionary(this.currentLangSignal())]);
    this.isLoaded.set(true);
    this.dictVersionSignal.update((v: number) => v + 1);
  }

  setLanguage(lang: LangCode) {
    this.currentLangSignal.set(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
    this.applyDocumentLanguage();
    this.dictVersionSignal.update((v: number) => v + 1);
    void this.ensureDictionary(lang).then(() => this.dictVersionSignal.update((v: number) => v + 1));
  }

  t(code: string, params?: Record<string, any>): string {
    // Read reactive signals to track dependency in effects and computed values
    this.currentLangSignal();
    this.dictVersionSignal();

    const current = this.dictionaries.get(this.currentLangSignal());
    const fallback = this.dictionaries.get(FALLBACK_LANG);
    let text = current?.[code] || fallback?.[code] || this.dictionaries.get(DEFAULT_LANG)?.[code] || code;

    if (params) {
      for (const [key, val] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
      }
    }

    return text;
  }

  private async ensureDictionary(lang: LangCode): Promise<void> {
    if (this.dictionaries.has(lang)) {
      return;
    }
    const inFlight = this.loading.get(lang);
    if (inFlight) {
      return inFlight;
    }
    const request = (async () => {
      try {
        // Relative to the document base: "/" for core web, "./" for embedded plugin UIs.
        const response = await fetch(`i18n/${lang}.json`);
        if (response.ok) {
          this.dictionaries.set(lang, await response.json());
        }
      } catch (e) {
        console.warn(`Could not load i18n dictionary for ${lang}`, e);
      } finally {
        this.loading.delete(lang);
      }
    })();
    this.loading.set(lang, request);
    return request;
  }

  private applyDocumentLanguage(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const lang = this.currentLangSignal();
    const info = findLanguage(lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', info?.dir ?? 'ltr');
  }

  private readStoredLang(): LangCode {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_LANG;
    }
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return isLangCode(saved) ? saved : DEFAULT_LANG;
  }
}
