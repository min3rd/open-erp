import { Directive, ElementRef, Input, effect, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Directive({
  selector: '[appTranslate]',
  standalone: true
})
export class TranslateDirective {
  private el = inject(ElementRef);
  private i18n = inject(I18nService);

  @Input('appTranslate') key: string = '';
  @Input('appTranslateParams') params?: Record<string, any>;
  @Input('appTranslateTarget') target: 'text' | 'placeholder' | 'title' = 'text';

  constructor() {
    effect(() => {
      // Triggers when language changes
      this.i18n.currentLang();
      if (!this.key) return;

      const translated = this.i18n.t(this.key, this.params);
      if (this.target === 'placeholder') {
        this.el.nativeElement.placeholder = translated;
      } else if (this.target === 'title') {
        this.el.nativeElement.title = translated;
      } else {
        this.el.nativeElement.textContent = translated;
      }
    });
  }
}
