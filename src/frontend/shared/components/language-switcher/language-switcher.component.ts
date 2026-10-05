import { Component, inject } from '@angular/core';
import { LangCode } from '../../enums/lang.enum';
import { I18nService } from '../../i18n/i18n.service';
import { LanguageInfo, releasedLanguages } from '../../i18n/language-registry';
import { TranslateDirective } from '../../i18n/translate.directive';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * Language picker. Only locales whose dictionary is complete (`released`) are
 * offered, so a partially translated locale is never selectable.
 */
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslateDirective, TranslatePipe],
  templateUrl: './language-switcher.component.html'
})
export class LanguageSwitcherComponent {
  i18n = inject(I18nService);

  readonly languages: readonly LanguageInfo[] = releasedLanguages();

  onSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.i18n.setLanguage(value as LangCode);
  }
}
