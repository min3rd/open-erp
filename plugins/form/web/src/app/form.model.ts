export interface FormDefinition {
  id: string;
  slug: string;
  title_text: string;
  description?: string;
  document?: FormDocument;
  entity_mapping?: Record<string, FormEntityMapping> | null;
  publish_status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  captcha: 'none' | 'recaptcha-v3';
  latest_version: number;
  accept_responses?: boolean;
  close_at?: string;
  response_limit?: number;
  updated_at?: string;
}

export type FormStructureMode = 'SECTION' | 'PAGE' | 'STEP';

export interface FormLayoutConfig {
  mode?: FormStructureMode;
  columns?: 1 | 2 | 3 | 4;
  mobile_columns?: 1 | 2;
  row_gap?: 'compact' | 'normal' | 'relaxed';
}

export interface FormDocument {
  layout?: FormLayoutConfig;
  items: FormItem[];
}

export type FormContainerType = 'SECTION' | 'PAGE' | 'STEP';

export type FormItemType =
  // 1. Nhóm nhập liệu cơ bản (Basic Inputs)
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'PASSWORD'
  | 'HIDDEN'
  // 2. Nhóm lựa chọn (Choice & Selection)
  | 'CHECKBOX'
  | 'MULTI_CHOICE'
  | 'SINGLE_CHOICE'
  | 'DROPDOWN'
  | 'MULTI_SELECT'
  | 'SWITCH'
  // 3. Nhóm dữ liệu định dạng chuyên biệt (Specialized Inputs)
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'CURRENCY'
  | 'DATE'
  | 'TIME'
  | 'DATE_RANGE'
  | 'COLOR'
  // 4. Nhóm tệp & Đa phương tiện (Media & Upload)
  | 'FILE_UPLOAD'
  | 'IMAGE_UPLOAD'
  | 'SIGNATURE'
  // 5. Nhóm nâng cao & Khảo sát (Advanced & Interactive)
  | 'RICH_TEXT'
  | 'SLIDER'
  | 'RATING'
  | 'MATRIX'
  | 'ADDRESS'
  | 'GRID'
  | 'REPEATER'
  // 6. Nhóm cấu trúc & Bố cục (Layout & Structural Components)
  | 'STATIC_TEXT'
  | 'DIVIDER'
  | 'SECTION'
  | 'PAGE'
  | 'STEP';

export type GridColumnType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'FORMULA';

export type GridSummaryType = 'NONE' | 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';

export interface GridColumnOption {
  value: string;
  label?: string;
}

export interface GridColumnDef {
  key: string;
  label: string;
  type: GridColumnType;
  width?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<GridColumnOption | string | FormOption>;
  formula?: string; // e.g. "qty * price" or "[qty] * [price]"
  summary?: GridSummaryType;

  // 3 option sources: STATIC, CATALOG, EXTERNAL_API
  option_source?: FormOptionSourceType;
  catalog_type?: string;
  depends_on?: string; // parent column key in the same row, or parent form question ref
  parent_filter_key?: string;
  api_url?: string;
  api_method?: 'GET' | 'POST';
  api_items_path?: string;
  api_value_key?: string;
  api_label_key?: string;
}

export type FormOptionSourceType = 'STATIC' | 'CATALOG' | 'EXTERNAL_API';

export interface RepeaterFieldDef {
  key: string;
  label: string;
  type: FormItemType;
  required?: boolean;
}

export interface FormItem {
  type: FormItemType;
  title?: string;
  description?: string;
  ref?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  options?: FormOption[];
  // Dynamic choice source configuration
  option_source?: FormOptionSourceType;
  catalog_type?: string;
  depends_on?: string;
  parent_filter_key?: string;
  api_url?: string;
  api_method?: 'GET' | 'POST';
  api_items_path?: string;
  api_value_key?: string;
  api_label_key?: string;
  rows?: string[];
  columns?: string[];
  // Excel-style Grid configuration
  columns_def?: GridColumnDef[];
  default_rows?: number;
  min_rows?: number;
  max_rows?: number;
  allow_add_row?: boolean;
  allow_delete_row?: boolean;
  file_limits?: { max_files?: number; max_size_mb?: number };
  accept_mime_types?: string;
  grading?: { points: number; correct: string[]; feedback?: string };
  // Numeric, Slider & Currency
  min_value?: number;
  max_value?: number;
  step_value?: number;
  currency_code?: string;
  currency_symbol?: string;
  mask_pattern?: string;
  // Typography & Layout
  static_text_type?: 'H1' | 'H2' | 'H3' | 'PARAGRAPH' | 'P' | 'ALERT_INFO' | 'ALERT_WARNING' | 'ALERT_WARN' | 'ALERT_SUCCESS';
  content?: string;
  divider_style?: 'SOLID' | 'DASHED' | 'DOTTED' | 'SPACER';
  default_value?: any;
  // Repeater array field
  repeater_fields?: RepeaterFieldDef[];
  // Container grid config (for SECTION / PAGE / STEP)
  grid_columns?: 1 | 2 | 3 | 4;
  mobile_columns?: 1 | 2;
  // Field layout & responsive config
  col_span?: 1 | 2 | 3 | 4;
  row_span?: 1 | 2 | 3;
  mobile_span?: 1 | 2;
  row_break?: boolean;
  hide_on_mobile?: boolean;
}

export type FormLogicAction =
  | 'GOTO_REF'
  | 'NEXT_SECTION'
  | 'NEXT_PAGE'
  | 'NEXT_STEP'
  | 'SUBMIT_FORM';

export interface FormOption {
  value: string;
  label?: string;
  parent_code?: string;
  logic?: { action: FormLogicAction; goto_ref?: string };
}

export interface FormEntityMapping {
  target_plugin: string;
  target_entity: string;
  target_field: string;
}

export interface EntityRegistryEntry {
  pluginId: string;
  entityName: string;
  table: string;
  storageType: string;
  schemaDefinition?: { fields?: string[] } | null;
}

export interface FormResponse {
  id: string;
  form_id: string;
  form_version: number;
  answers: Record<string, unknown>;
  responder_email?: string;
  entity_write_status: 'SKIPPED' | 'OK' | 'FAILED';
  submitted_at: string;
}

export interface FormSummary {
  total_responses: number;
  choice_counts: Record<string, number>;
  numeric_averages: Record<string, number>;
}
