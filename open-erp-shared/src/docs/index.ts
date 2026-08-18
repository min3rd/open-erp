import { ComponentDoc } from '../models/component-doc.model';
import { BUTTON_DOC } from './button.doc';
import { AVATAR_DOC } from './avatar.doc';
import { STATUS_BADGE_DOC } from './status-badge.doc';
import { KPI_CARD_DOC } from './kpi-card.doc';
import { SKELETON_DOC } from './skeleton.doc';
import { ICON_DOC } from './icon.doc';
import { EMPTY_STATE_DOC } from './empty-state.doc';
import { THEME_TOGGLE_DOC } from './theme-toggle.doc';
import { LANGUAGE_SELECTOR_DOC } from './language-selector.doc';
import { MAINTENANCE_BANNER_DOC } from './maintenance-banner.doc';
import {
  ICON_BUTTON_DOC,
  TYPOGRAPHY_DOC,
  LINK_DOC,
  DIVIDER_DOC,
  BADGE_DOC,
  TAG_DOC,
  SPINNER_DOC,
  KBD_DOC
} from './basic-components.doc';
import {
  LABEL_DOC,
  INPUT_DOC,
  PASSWORD_INPUT_DOC,
  NUMBER_INPUT_DOC,
  TEXTAREA_DOC,
  SELECT_DOC,
  MULTI_SELECT_DOC,
  CHECKBOX_DOC,
  RADIO_GROUP_DOC,
  SWITCH_DOC,
  DATE_PICKER_DOC,
  TIME_PICKER_DOC,
  DATE_RANGE_PICKER_DOC,
  SLIDER_DOC,
  COLOR_PICKER_DOC,
  AUTOCOMPLETE_DOC,
  TAG_INPUT_DOC,
  RATING_DOC,
  RICH_TEXT_EDITOR_DOC,
  OTP_INPUT_DOC,
  FILE_UPLOAD_DOC,
  SUBMIT_BUTTON_DOC,
  RESET_BUTTON_DOC,
  STEPPER_DOC,
  HELPER_TEXT_DOC
} from './form-components.doc';

import {
  NAVBAR_DOC,
  SIDEBAR_DOC,
  BREADCRUMB_DOC,
  PAGINATION_DOC,
  TABS_DOC,
  DROPDOWN_MENU_DOC,
  BOTTOM_NAV_DOC,
  ANCHOR_DOC,
  BACK_TO_TOP_DOC,
  SPEED_DIAL_DOC,
  SEGMENTED_CONTROL_DOC
} from './navigation-components.doc';

import {
  TABLE_DOC,
  CARD_DOC,
  LIST_DOC,
  AVATAR_GROUP_DOC,
  ACCORDION_DOC,
  TIMELINE_DOC,
  TREE_VIEW_DOC,
  STATISTIC_DOC,
  CAROUSEL_DOC,
  DESCRIPTIONS_DOC,
  IMAGE_DOC,
  CALENDAR_DOC,
  TOOLTIP_DOC
} from './data-display-components.doc';

import { FEEDBACK_COMPONENTS_DOCS } from './feedback-components.doc';
import { OVERLAY_COMPONENTS_DOCS } from './overlay-components.doc';
import { UTILITY_COMPONENTS_DOCS } from './utility-components.doc';

export * from '../models/component-doc.model';
export * from './button.doc';
export * from './avatar.doc';
export * from './status-badge.doc';
export * from './kpi-card.doc';
export * from './skeleton.doc';
export * from './icon.doc';
export * from './empty-state.doc';
export * from './theme-toggle.doc';
export * from './language-selector.doc';
export * from './maintenance-banner.doc';
export * from './basic-components.doc';
export * from './form-components.doc';
export * from './navigation-components.doc';
export * from './data-display-components.doc';
export * from './feedback-components.doc';
export * from './overlay-components.doc';
export * from './utility-components.doc';

/**
 * Danh sách tổng hợp toàn bộ tài liệu và preview của Component.
 * Bất kỳ component nào được thêm vào mảng này sẽ TỰ ĐỘNG hiển thị trên Trang Tổng quan (Component Showcase).
 */
export const ALL_COMPONENT_DOCS: ComponentDoc[] = [
  // General & Actions
  BUTTON_DOC,
  ICON_BUTTON_DOC,
  TYPOGRAPHY_DOC,
  LINK_DOC,
  DIVIDER_DOC,
  KBD_DOC,
  ICON_DOC,
  SUBMIT_BUTTON_DOC,
  RESET_BUTTON_DOC,
  
  // Data Display
  TABLE_DOC,
  CARD_DOC,
  LIST_DOC,
  AVATAR_DOC,
  AVATAR_GROUP_DOC,
  BADGE_DOC,
  TAG_DOC,
  ACCORDION_DOC,
  TIMELINE_DOC,
  TREE_VIEW_DOC,
  STATISTIC_DOC,
  KPI_CARD_DOC,
  CAROUSEL_DOC,
  DESCRIPTIONS_DOC,
  IMAGE_DOC,
  CALENDAR_DOC,
  TOOLTIP_DOC,
  STATUS_BADGE_DOC,
  RATING_DOC,
  STEPPER_DOC,

  // Form & Inputs
  LABEL_DOC,
  INPUT_DOC,
  PASSWORD_INPUT_DOC,
  NUMBER_INPUT_DOC,
  TEXTAREA_DOC,
  SELECT_DOC,
  MULTI_SELECT_DOC,
  CHECKBOX_DOC,
  RADIO_GROUP_DOC,
  SWITCH_DOC,
  DATE_PICKER_DOC,
  TIME_PICKER_DOC,
  DATE_RANGE_PICKER_DOC,
  SLIDER_DOC,
  COLOR_PICKER_DOC,
  AUTOCOMPLETE_DOC,
  TAG_INPUT_DOC,
  OTP_INPUT_DOC,
  FILE_UPLOAD_DOC,
  RICH_TEXT_EDITOR_DOC,

  // Feedback & Status (New)
  ...FEEDBACK_COMPONENTS_DOCS,
  SPINNER_DOC,
  SKELETON_DOC,
  EMPTY_STATE_DOC,
  HELPER_TEXT_DOC,

  // Overlay & Popups (New)
  ...OVERLAY_COMPONENTS_DOCS,

  // Navigation & Utility (New)
  NAVBAR_DOC,
  SIDEBAR_DOC,
  BREADCRUMB_DOC,
  PAGINATION_DOC,
  TABS_DOC,
  DROPDOWN_MENU_DOC,
  BOTTOM_NAV_DOC,
  ANCHOR_DOC,
  BACK_TO_TOP_DOC,
  SPEED_DIAL_DOC,
  SEGMENTED_CONTROL_DOC,
  ...UTILITY_COMPONENTS_DOCS,
  THEME_TOGGLE_DOC,
  LANGUAGE_SELECTOR_DOC,
  MAINTENANCE_BANNER_DOC
];

