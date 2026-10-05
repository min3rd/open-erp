import { LayoutId, ShapeId, ThemeId } from '../enums';

/**
 * Static theme registry. Must stay in sync with the backend theme registry
 * (`industrial` default + the three tinted alternates) and the CSS token
 * blocks keyed by `[data-theme="<id>"]` in each app's `styles.css`.
 *
 * A theme owns its colour palette + shell (topbar/sidebar) colours and supplies
 * the *default* shape and layout. Shape and layout are per-user preferences
 * (ShapeId / LayoutId), so a user can mix e.g. amber colours with sharp corners
 * and a left rail.
 */
export interface ThemeDefinition {
  id: ThemeId;
  /** i18n key for the theme name (never a hardcoded label). */
  nameKey: string;
  /** Corner scale applied while the user keeps the shape preference on AUTO. */
  defaultShape: ShapeId;
  /** Menu placement applied while the layout preference is on AUTO. */
  defaultLayout: LayoutId;
}

export interface ShapeOption {
  id: ShapeId;
  nameKey: string;
}

export interface LayoutOption {
  id: LayoutId;
  nameKey: string;
}

export const DEFAULT_THEME_ID = ThemeId.INDUSTRIAL;

export const THEME_REGISTRY: readonly ThemeDefinition[] = [
  {
    id: ThemeId.INDUSTRIAL,
    nameKey: 'THEME_INDUSTRIAL',
    defaultShape: ShapeId.SHARP,
    defaultLayout: LayoutId.SIDE
  },
  {
    id: ThemeId.SLATE_BLUE,
    nameKey: 'THEME_SLATE_BLUE',
    defaultShape: ShapeId.SOFT,
    defaultLayout: LayoutId.TOP
  },
  {
    id: ThemeId.EMERALD,
    nameKey: 'THEME_EMERALD',
    defaultShape: ShapeId.SOFT,
    defaultLayout: LayoutId.RIGHT
  },
  {
    id: ThemeId.AMBER,
    nameKey: 'THEME_AMBER',
    defaultShape: ShapeId.ROUNDED,
    defaultLayout: LayoutId.TOP
  }
];

/** Shape choices for the appearance switcher (AUTO first). */
export const SHAPE_REGISTRY: readonly ShapeOption[] = [
  { id: ShapeId.AUTO, nameKey: 'SHAPE_AUTO' },
  { id: ShapeId.SHARP, nameKey: 'SHAPE_SHARP' },
  { id: ShapeId.SOFT, nameKey: 'SHAPE_SOFT' },
  { id: ShapeId.ROUNDED, nameKey: 'SHAPE_ROUNDED' }
];

/** Menu-placement choices for the appearance switcher (AUTO first). */
export const LAYOUT_REGISTRY: readonly LayoutOption[] = [
  { id: LayoutId.AUTO, nameKey: 'LAYOUT_AUTO' },
  { id: LayoutId.SIDE, nameKey: 'LAYOUT_SIDE' },
  { id: LayoutId.TOP, nameKey: 'LAYOUT_TOP' },
  { id: LayoutId.RIGHT, nameKey: 'LAYOUT_RIGHT' },
  { id: LayoutId.DRAWER, nameKey: 'LAYOUT_DRAWER' }
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEME_REGISTRY.some((theme) => theme.id === value);
}

export function isShapeId(value: unknown): value is ShapeId {
  return (Object.values(ShapeId) as unknown[]).includes(value);
}

export function isLayoutId(value: unknown): value is LayoutId {
  return (Object.values(LayoutId) as unknown[]).includes(value);
}

/** Shape to apply: the user's explicit pick, otherwise the theme default. */
export function resolveShape(theme: ThemeId, preference: ShapeId | null): ShapeId {
  if (preference && preference !== ShapeId.AUTO) {
    return preference;
  }
  return THEME_REGISTRY.find((item) => item.id === theme)?.defaultShape ?? ShapeId.SHARP;
}

/** Menu placement to apply: the user's explicit pick, otherwise the theme default. */
export function resolveLayout(theme: ThemeId, preference: LayoutId | null): LayoutId {
  if (preference && preference !== LayoutId.AUTO) {
    return preference;
  }
  return THEME_REGISTRY.find((item) => item.id === theme)?.defaultLayout ?? LayoutId.SIDE;
}
