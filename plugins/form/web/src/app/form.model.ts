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
  | 'SECTION'
  | 'PAGE'
  | 'STEP'
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'DROPDOWN'
  | 'DATE'
  | 'NUMBER'
  | 'RATING'
  | 'FILE_UPLOAD'
  | 'MATRIX';

export type FormOptionSourceType = 'STATIC' | 'CATALOG' | 'EXTERNAL_API';

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
  api_url?: string;
  api_method?: 'GET' | 'POST';
  api_items_path?: string;
  api_value_key?: string;
  api_label_key?: string;
  rows?: string[];
  columns?: string[];
  file_limits?: { max_files?: number; max_size_mb?: number };
  grading?: { points: number; correct: string[]; feedback?: string };
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
