/**
 * Shared icon identifiers. Each value maps 1:1 to a `feather-icons` key via the
 * icon registry, so components never import `feather-icons` directly and the
 * underlying source can be swapped later without touching call sites.
 */
export enum IconName {
  MENU = 'menu',
  BELL = 'bell',
  X = 'x',
  CHEVRON_DOWN = 'chevron-down',
  CHEVRON_LEFT = 'chevron-left',
  CHEVRON_RIGHT = 'chevron-right',
  CHECK = 'check',
  PLUS = 'plus',
  EDIT = 'edit-2',
  TRASH = 'trash-2',
  SEARCH = 'search',
  REFRESH = 'refresh-cw',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  SETTINGS = 'settings',
  USER = 'user',
  MORE_VERTICAL = 'more-vertical',
  EXTERNAL_LINK = 'external-link',
  FILTER = 'filter',
  CALENDAR = 'calendar',
  ALERT_TRIANGLE = 'alert-triangle',
  LOG_OUT = 'log-out',
  GLOBE = 'globe',
  SUN = 'sun',
  MOON = 'moon',
  MONITOR = 'monitor',
  LOCK = 'lock',
  GRID = 'grid',
  SHIELD = 'shield',
  KEY = 'key',
  HOME = 'home',
  FILE_TEXT = 'file-text',
  PACKAGE = 'package'
}

/**
 * String-value form of {@link IconName}, for data models that carry an icon id
 * (e.g. context-menu items). `<app-icon>` accepts a plain `string` so static
 * template attributes work in every tool.
 */
export type IconNameValue = `${IconName}`;
