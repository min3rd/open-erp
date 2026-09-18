import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeMode } from '../../enums';
import { ThemeService } from '../../theme/theme.service';
import { TranslateDirective } from '../../i18n/translate.directive';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule, TranslateDirective, TranslatePipe],
  templateUrl: './theme-switcher.component.html'
})
export class ThemeSwitcherComponent {
  theme = inject(ThemeService);

  readonly modes: ReadonlyArray<{ mode: ThemeMode; label: string }> = [
    { mode: ThemeMode.SYSTEM, label: 'THEME_SYSTEM' },
    { mode: ThemeMode.LIGHT, label: 'THEME_LIGHT' },
    { mode: ThemeMode.DARK, label: 'THEME_DARK' }
  ];

  setMode(mode: ThemeMode) {
    this.theme.setMode(mode);
  }
}
