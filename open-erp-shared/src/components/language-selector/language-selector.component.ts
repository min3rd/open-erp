import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';
import { LanguageItem } from '../../models/app-config.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'erp-language-selector',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './language-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSelectorComponent {
  readonly langService = inject(LanguageService);
  readonly isOpen = signal<boolean>(false);

  readonly currentLanguageItem = computed(() => {
    return this.langService.supportedLanguages().find((l: LanguageItem) => l.code === this.langService.currentLanguage());
  });

  readonly currentLabel = computed(() => {
    return this.currentLanguageItem()?.name || this.langService.currentLanguage().toUpperCase();
  });

  readonly currentCode = computed(() => {
    return (this.langService.currentLanguage() || 'VI').toUpperCase();
  });

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  selectLanguage(langCode: string): void {
    this.langService.setLanguage(langCode);
    this.isOpen.set(false);
  }
}
