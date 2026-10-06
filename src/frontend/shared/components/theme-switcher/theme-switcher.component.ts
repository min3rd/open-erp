import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutId, ShapeId, ThemeId, ThemeMode } from '../../enums';
import {
  AUTO_OPTION,
  LAYOUT_REGISTRY,
  SHAPE_REGISTRY,
  THEME_REGISTRY,
  isThemeId
} from '../../theme/theme-registry';import { ThemeService } from '../../theme/theme.service';
import { RequirePermissionDirective } from '../../directives/require-permission.directive';
import { TranslateDirective } from '../../i18n/translate.directive';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * Appearance switcher. Everything here is per user: colour theme (the tenant
 * default applies while it is on AUTO), shape, menu layout and light/dark mode.
 * Owners/admins additionally get a button that promotes the selected theme to
 * the tenant-wide default.
 */
@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule, RequirePermissionDirective, TranslateDirective, TranslatePipe],
  templateUrl: './theme-switcher.component.html'
})
export class ThemeSwitcherComponent {
  theme = inject(ThemeService);

  /** Only tenant owners/admins may change the tenant-wide default theme. */
  readonly themePermission = 'core:tenant:settings-manage';

  readonly themes = THEME_REGISTRY;
  readonly shapes = SHAPE_REGISTRY;
  readonly layouts = LAYOUT_REGISTRY;

  /** Select value meaning "follow the tenant default". */
  readonly themeAutoValue = AUTO_OPTION;

  /** Select values; AUTO when the user has no explicit choice. */
  readonly themeValue = computed(() => this.theme.themePreference() ?? AUTO_OPTION);
  readonly shapeValue = computed(() => this.theme.shapePreference() ?? ShapeId.AUTO);
  readonly layoutValue = computed(() => this.theme.layoutPreference() ?? LayoutId.AUTO);

  /** i18n key of the tenant default theme, shown next to the promote button. */
  readonly tenantThemeNameKey = computed(() =>
    THEME_REGISTRY.find((item) => item.id === this.theme.tenantTheme())?.nameKey ?? ''
  );

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
    if (value === AUTO_OPTION) {
      this.theme.clearTheme();
    } else if (isThemeId(value)) {
      this.theme.setTheme(value as ThemeId);
    }
  }

  onShapeChange(event: Event) {
    this.applyPreference(event, (value) => this.theme.setShape(value as ShapeId));
  }

  onLayoutChange(event: Event) {
    this.applyPreference(event, (value) => this.theme.setLayout(value as LayoutId));
  }

  /** Reads the select value and hands it to the matching preference setter. */
  private applyPreference(event: Event, apply: (value: string) => void): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      apply(value);
    }
  }

  /** Promotes the currently applied theme to the tenant-wide default. */
  setTenantDefault() {
    this.theme.setTenantTheme(this.theme.themeId());
  }
}
