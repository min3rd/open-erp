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
  /** Where the section menu lives for this theme. */
  navLayout: NavLayout;
}

/** Menu placement a theme can use; each theme picks one so layouts differ too. */
export type NavLayout = 'side' | 'top' | 'right';

export const DEFAULT_THEME_ID = ThemeId.INDUSTRIAL;

export const THEME_REGISTRY: readonly ThemeDefinition[] = [
  {
    id: ThemeId.INDUSTRIAL,
    nameKey: 'THEME_INDUSTRIAL',
    shape: ShapeVariant.SHARP,
    navLayout: 'side'
  },
  {
    id: ThemeId.SLATE_BLUE,
    nameKey: 'THEME_SLATE_BLUE',
    shape: ShapeVariant.SOFT,
    navLayout: 'top'
  },
  {
    id: ThemeId.EMERALD,
    nameKey: 'THEME_EMERALD',
    shape: ShapeVariant.SOFT,
    navLayout: 'right'
  },
  {
    id: ThemeId.AMBER,
    nameKey: 'THEME_AMBER',
    shape: ShapeVariant.SOFT,
    navLayout: 'top'
  }
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEME_REGISTRY.some((theme) => theme.id === value);
}

export function navLayoutFor(id: ThemeId): NavLayout {
  return THEME_REGISTRY.find((theme) => theme.id === id)?.navLayout ?? 'side';
}
