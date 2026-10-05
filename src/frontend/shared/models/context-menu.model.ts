import { IconNameValue } from '../enums';

/**
 * One entry of a right-click / keyboard context menu. `action` is a shortcut to
 * an existing handler (drawer/route) — the menu never introduces new business
 * behaviour. `disabledReasonKey` is rendered under the label so a user without
 * the permission sees why the item is greyed out.
 */
export interface ContextMenuItem {
  id: string;
  labelKey: string;
  icon?: IconNameValue;
  disabled?: boolean;
  disabledReasonKey?: string;
  danger?: boolean;
  action: () => void;
}
