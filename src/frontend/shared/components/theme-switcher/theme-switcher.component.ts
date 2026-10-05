import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutId, ShapeId, ThemeId, ThemeMode } from '../../enums';
import {
  LAYOUT_REGISTRY,
  SHAPE_REGISTRY,
  THEME_REGISTRY,
  isLayoutId,
  isShapeId,
  isThemeId
} from '../../theme/theme-registry';
import { ThemeService } from '../../theme/theme.service';
import { RequirePermissionDirective } from '../../directives/require-permission.directive';
import { TranslateDirective } from '../../i18n/translate.directive';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * Appearance switcher: colour theme (tenant-wide, permission-gated), plus the
 * per-user shape, menu layout and light/dark mode. Shape and layout default to
 * `AUTO`, which keeps the colour theme's own look.
 */
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
  readonly shapes = SHAPE_REGISTRY;
  readonly layouts = LAYOUT_REGISTRY;

  /** Current select values; `AUTO` when the user has no explicit override. */
  readonly shapeValue = computed(() => this.theme.shapePreference() ?? ShapeId.AUTO);
  readonly layoutValue = computed(() => this.theme.layoutPreference() ?? LayoutId.AUTO);

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

  onShapeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (isShapeId(value)) {
      this.theme.setShape(value as ShapeId);
    }
  }

  onLayoutChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (isLayoutId(value)) {
      this.theme.setLayout(value as LayoutId);
    }
  }
}
