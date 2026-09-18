import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../i18n/i18n.service';
import { TranslateDirective } from '../../i18n/translate.directive';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateDirective],
  templateUrl: './language-switcher.component.html'
})
export class LanguageSwitcherComponent {
  i18n = inject(I18nService);

  setLang(lang: 'vi' | 'en') {
    this.i18n.setLanguage(lang);
  }
}
