import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  effect,
  input,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface LanguageOption {
  code: string;
  label: string;
  flagCode: string; // Country code for flag API
}

@Component({
  selector: 'language-selector',
  imports: [CommonModule, TranslocoModule, Select, FormsModule],
  templateUrl: './language-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelector {
  private translocoService = inject(TranslocoService);
  private cdr = inject(ChangeDetectorRef);
  private readonly STORAGE_KEY = 'app.language';

  // Input to control if showing in narrow mode
  showLabel = input<boolean>(true);

  languages: LanguageOption[] = [
    { code: 'en', label: 'English', flagCode: 'GB' },
    { code: 'es', label: 'Español', flagCode: 'ES' },
  ];

  // Helper to get flag image URL
  getFlagUrl(flagCode: string): string {
    return `https://flagsapi.com/${flagCode}/flat/64.png`;
  }

  // Use a writable signal instead of computed for two-way binding
  selectedLanguage = signal<string>(this.loadLanguage());

  constructor() {
    // Set the initial language
    this.translocoService.setActiveLang(this.selectedLanguage());

    // Persist language changes
    effect(() => {
      const lang = this.selectedLanguage();
      this.saveLanguage(lang);
      this.translocoService.setActiveLang(lang);
      this.cdr.markForCheck();
    });
  }

  private loadLanguage(): string {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'en';
    }

    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved || 'en';
  }

  private saveLanguage(languageCode: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, languageCode);
    }
  }
}
