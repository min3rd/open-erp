import { ShapeVariant, ThemeId } from '../enums';

/**
 * Static theme registry. Must stay in sync with the backend theme registry
 * (`industrial` default + the three tinted alternates) and the CSS token
 * blocks keyed by `[data-theme="<id>"]` in each app's `styles.css`.
 */
export interface ThemeDefinition {
  id: ThemeId;
  /** i18n key for the theme name (never a hardcoded label). */
  nameKey: string;
  /** Corner token applied to controls/containers for this theme. */
  shape: ShapeVariant;
}

export const DEFAULT_THEME_ID = ThemeId.INDUSTRIAL;

export const THEME_REGISTRY: readonly ThemeDefinition[] = [
  {
    id: ThemeId.INDUSTRIAL,
    nameKey: 'THEME_INDUSTRIAL',
    shape: ShapeVariant.SHARP
  },
  {
    id: ThemeId.SLATE_BLUE,
    nameKey: 'THEME_SLATE_BLUE',
    shape: ShapeVariant.SOFT
  },
  {
    id: ThemeId.EMERALD,
    nameKey: 'THEME_EMERALD',
    shape: ShapeVariant.SOFT
  },
  {
    id: ThemeId.AMBER,
    nameKey: 'THEME_AMBER',
    shape: ShapeVariant.SOFT
  }
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEME_REGISTRY.some((theme) => theme.id === value);
}
