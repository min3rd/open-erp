import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { LanguageItem } from '../../models/app-config.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'erp-language-selector',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './language-selector.component.html'
})
export class LanguageSelectorComponent {
  langService = inject(LanguageService);
  isOpen = signal<boolean>(false);

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  selectLanguage(langCode: string): void {
    this.langService.setLanguage(langCode);
    this.isOpen.set(false);
  }

  currentLanguageItem(): LanguageItem | undefined {
    return this.langService.supportedLanguages().find((l: LanguageItem) => l.code === this.langService.currentLanguage());
  }

  currentLabel(): string {
    return this.currentLanguageItem()?.name || this.langService.currentLanguage().toUpperCase();
  }

  currentCode(): string {
    return (this.langService.currentLanguage() || 'VI').toUpperCase();
  }
}
