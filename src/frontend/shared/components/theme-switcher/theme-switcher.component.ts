import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeId, ThemeMode } from '../../enums';
import { THEME_REGISTRY, isThemeId } from '../../theme/theme-registry';
import { ThemeService } from '../../theme/theme.service';
import { RequirePermissionDirective } from '../../directives/require-permission.directive';
import { TranslateDirective } from '../../i18n/translate.directive';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule, RequirePermissionDirective, TranslateDirective, TranslatePipe],
  templateUrl: './theme-switcher.component.html'
})
export class ThemeSwitcherComponent {
  theme = inject(ThemeService);

  /** Only tenant owners/admins may change the tenant-wide theme. */
  readonly themePermission = 'core:tenant:settings-manage';

  readonly themes = THEME_REGISTRY;

  readonly modes: ReadonlyArray<{ mode: ThemeMode; label: string }> = [
    { mode: ThemeMode.SYSTEM, label: 'THEME_SYSTEM' },
    { mode: ThemeMode.LIGHT, label: 'THEME_LIGHT' },
    { mode: ThemeMode.DARK, label: 'THEME_DARK' }
  ];

  setMode(mode: ThemeMode) {
    this.theme.setMode(mode);
  }

  onThemeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (isThemeId(value)) {
      this.theme.setTheme(value as ThemeId);
    }
  }
}
