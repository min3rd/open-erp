import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  effect,
  input,
  output,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Popover } from 'primeng/popover';
import { SelectButton } from 'primeng/selectbutton';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { LanguageService, LanguageOption } from '../../services/language.service';

@Component({
  selector: 'language-switcher',
  imports: [
    CommonModule,
    TranslocoModule,
    Button,
    Dialog,
    FormsModule,
    InputText,
    Popover,
    SelectButton,
    InputGroup,
    InputGroupAddon,
  ],
  templateUrl: './language-switcher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher implements OnInit {
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private readonly STORAGE_KEY = 'app.lang';

  // Inputs
  mode = input<'sidebar' | 'narrow'>('sidebar');
  current = input<string>(this.loadLanguage());

  // Outputs
  change = output<string>();

  // State
  selectedLanguage = signal<string>(this.loadLanguage());
  allLanguages = signal<LanguageOption[]>([]);
  showAllLanguagesDialog = signal(false);
  searchQuery = signal('');

  // Computed
  currentLanguageOption = computed(() => {
    const code = this.selectedLanguage();
    return this.allLanguages().find((lang) => lang.code === code) || this.allLanguages()[0];
  });

  primaryLanguages = computed(() => {
    return this.allLanguages().filter((lang) => lang.code === 'vi' || lang.code === 'en');
  });

  primaryLanguageOptions = computed(() => {
    return this.primaryLanguages().map((lang) => ({
      label: lang.label,
      value: lang.code,
      icon: `flag-icon-${lang.flagCode.toLowerCase()}`,
    }));
  });

  filteredLanguages = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.allLanguages();
    return this.allLanguages().filter(
      (lang) => lang.label.toLowerCase().includes(query) || lang.code.toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
    // Load languages from service
    this.languageService.loadLanguages().subscribe((languages) => {
      this.allLanguages.set(languages);
    });
  }

  constructor() {
    // Set the initial language
    this.translocoService.setActiveLang(this.selectedLanguage());

    // Sync with input
    // effect(
    //   () => {
    //     const inputLang = this.current();
    //     if (inputLang && inputLang !== this.selectedLanguage()) {
    //       this.selectedLanguage.set(inputLang);
    //     }
    //   },
    //   { allowSignalWrites: true }
    // );

    // Persist language changes and emit event
    effect(() => {
      const lang = this.selectedLanguage();
      this.saveLanguage(lang);
      this.translocoService.setActiveLang(lang);
      this.change.emit(lang);
    });
  }

  getFlagUrl(flagCode: string): string {
    return `https://flagsapi.com/${flagCode}/flat/64.png`;
  }

  getFlagForLanguageCode(code: string): string {
    const lang = this.primaryLanguages().find((l) => l.code === code);
    return this.getFlagUrl(lang?.flagCode || 'VN');
  }

  onPrimaryLanguageChange(code: string): void {
    if (code) {
      this.selectedLanguage.set(code);
    }
  }

  selectLanguage(code: string): void {
    this.selectedLanguage.set(code);
    this.showAllLanguagesDialog.set(false);
    this.searchQuery.set('');
  }

  openAllLanguagesDialog(): void {
    this.showAllLanguagesDialog.set(true);
    this.searchQuery.set('');
  }

  closeAllLanguagesDialog(): void {
    this.showAllLanguagesDialog.set(false);
    this.searchQuery.set('');
  }

  private loadLanguage(): string {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'vi';
    }

    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved || 'vi';
  }

  private saveLanguage(languageCode: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, languageCode);
    }
  }
}
