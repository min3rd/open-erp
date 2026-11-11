import { Injectable, signal, computed, inject, ApplicationRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LangCode } from '../enums/lang.enum';
import { DEFAULT_LANG, FALLBACK_LANG, findLanguage, isLangCode } from './language-registry';

const LANG_STORAGE_KEY = 'openerp_lang';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private http = inject(HttpClient, { optional: true });
  private appRef = inject(ApplicationRef, { optional: true });
  private currentLangSignal = signal<LangCode>(this.readStoredLang());
  public currentLang = computed(() => this.currentLangSignal());
  private dictVersionSignal = signal<number>(0);

  private dictionaries = new Map<LangCode, Record<string, string>>();
  private loading = new Map<LangCode, Promise<void>>();
  public isLoaded = signal<boolean>(false);

  constructor() {
    this.applyDocumentLanguage();
    this.loadDictionaries();

    if (typeof window !== 'undefined') {
      window.addEventListener('openerp:language-change', (event: Event) => {
        const customEvent = event as CustomEvent<{ lang: LangCode }>;
        const newLang = customEvent?.detail?.lang;
        if (newLang && newLang !== this.currentLangSignal() && isLangCode(newLang)) {
          this.currentLangSignal.set(newLang);
          this.applyDocumentLanguage();
          this.dictVersionSignal.update((v: number) => v + 1);
          void this.ensureDictionary(newLang).then(() => {
            this.dictVersionSignal.update((v: number) => v + 1);
            try {
              this.appRef?.tick();
            } catch {
              /* ignore tick errors */
            }
          });
        }
      });

      window.addEventListener('openerp:refresh-i18n', () => {
        void this.refreshAllDictionaries();
      });
    }
  }

  /** Loads the fallback + current locale; other locales load lazily on switch. */
  async loadDictionaries() {
    await Promise.all([this.ensureDictionary(FALLBACK_LANG), this.ensureDictionary(this.currentLangSignal())]);
    this.isLoaded.set(true);
    this.dictVersionSignal.update((v: number) => v + 1);
    try {
      this.appRef?.tick();
    } catch {
      /* ignore tick errors */
    }
  }

  setLanguage(lang: LangCode) {
    if (!isLangCode(lang)) {
      return;
    }
    const prevLang = this.currentLangSignal();
    this.currentLangSignal.set(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
    this.applyDocumentLanguage();
    this.dictVersionSignal.update((v: number) => v + 1);
    void this.ensureDictionary(lang).then(() => {
      this.dictVersionSignal.update((v: number) => v + 1);
      try {
        this.appRef?.tick();
      } catch {
        /* ignore tick errors */
      }
    });

    if (typeof window !== 'undefined' && prevLang !== lang) {
      window.dispatchEvent(new CustomEvent('openerp:language-change', { detail: { lang } }));
    }
  }

  /**
   * Registers an externally loaded dictionary (Sprint 08: public plugin pages
   * cannot rely on the document-relative fetch in `ensureDictionary`, so the
   * embedded UI loads the dictionary itself and hands it over here).
   */
  setDictionary(lang: LangCode, dictionary: Record<string, string>) {
    this.dictionaries.set(lang, dictionary);
    this.dictVersionSignal.update((v: number) => v + 1);
  }

  t(code: string, params?: Record<string, any>): string {
    // Read reactive signals to track dependency in effects and computed values
    this.currentLangSignal();
    this.dictVersionSignal();

    const current = this.dictionaries.get(this.currentLangSignal());
    const fallback = this.dictionaries.get(FALLBACK_LANG);
    let text = current?.[code] || fallback?.[code] || this.dictionaries.get(DEFAULT_LANG)?.[code];

    if (!text) {
      // Key missing: if already loaded and code is an uppercase token, schedule background refresh to heal stale cache (BUG-182)
      if (this.isLoaded() && typeof window !== 'undefined' && code.includes('_') && code === code.toUpperCase()) {
        this.triggerStaleDictionaryRefresh(this.currentLangSignal(), code);
      }
      text = code;
    }

    if (params) {
      for (const [key, val] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
      }
    }

    return text;
  }

  instant(code: string, params?: Record<string, any>): string {
    return this.t(code, params);
  }

  private staleCheckSet = new Set<string>();

  private triggerStaleDictionaryRefresh(lang: LangCode, key: string): void {
    if (this.staleCheckSet.has(key)) return;
    this.staleCheckSet.add(key);
    void this.reloadDictionaryHttp(lang).then((updated) => {
      if (updated && updated[key]) {
        this.dictVersionSignal.update((v) => v + 1);
        try {
          this.appRef?.tick();
        } catch {
          /* ignore tick errors */
        }
      }
    });
  }

  /** Force refresh all loaded dictionaries from server via HttpClient, bypassing browser cache (BUG-182) */
  async refreshAllDictionaries(): Promise<void> {
    const langs = [...this.dictionaries.keys()];
    if (!langs.length) {
      langs.push(FALLBACK_LANG, this.currentLangSignal());
    }
    await Promise.all(langs.map((l) => this.reloadDictionaryHttp(l)));
    this.dictVersionSignal.update((v) => v + 1);
    try {
      this.appRef?.tick();
    } catch {
      /* ignore tick errors */
    }
  }

  private async requestDictionary(lang: LangCode, force = false): Promise<Record<string, string> | null> {
    if (!this.http) {
      return null;
    }
    const query = force ? `?_t=${Date.now()}` : '';
    try {
      return await firstValueFrom(this.http.get<Record<string, string>>(`i18n/${lang}.json${query}`));
    } catch {
      try {
        return await firstValueFrom(this.http.get<Record<string, string>>(`/i18n/${lang}.json${query}`));
      } catch (err) {
        console.warn(`Could not load i18n dictionary for ${lang}`, err);
        return null;
      }
    }
  }

  private async reloadDictionaryHttp(lang: LangCode): Promise<Record<string, string> | null> {
    const dict = await this.requestDictionary(lang, true);
    if (dict) {
      this.dictionaries.set(lang, dict);
    }
    return dict;
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
        const dict = await this.requestDictionary(lang, false);
        if (dict) {
          this.dictionaries.set(lang, dict);
        }
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
