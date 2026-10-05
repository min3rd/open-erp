export enum ColorVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline',
  GHOST = 'ghost',
  DANGER = 'danger',
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info',
  DEFAULT = 'default'
}

export enum SizeVariant {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl'
}

export enum ShapeVariant {
  SHARP = 'sharp',
  SOFT = 'soft'
}

export enum ThemeMode {
  SYSTEM = 'SYSTEM',
  LIGHT = 'LIGHT',
  DARK = 'DARK'
}

/** Tenant-wide theme id, synchronised with the backend theme registry. */
export enum ThemeId {
  INDUSTRIAL = 'industrial',
  SLATE_BLUE = 'slate-blue',
  EMERALD = 'emerald',
  AMBER = 'amber'
}

/**
 * Per-user shape (corner scale) preference. `AUTO` follows the colour theme's
 * default shape, so the theme still looks the way it was designed unless the
 * user explicitly overrides it.
 */
export enum ShapeId {
  AUTO = 'auto',
  SHARP = 'sharp',
  SOFT = 'soft',
  ROUNDED = 'rounded'
}

/** Per-user menu placement. `AUTO` follows the colour theme's default layout. */
export enum LayoutId {
  AUTO = 'auto',
  /** Vertical rail on the left. */
  SIDE = 'side',
  /** Vertical rail on the right. */
  RIGHT = 'right',
  /** Horizontal bar under the topbar. */
  TOP = 'top',
  /** Menu inside a drawer opened from the content header. */
  DRAWER = 'drawer'
}
