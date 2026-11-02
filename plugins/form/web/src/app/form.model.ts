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

export interface FormDocument {
  items: FormItem[];
}

export type FormItemType =
  | 'SECTION'
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

export interface FormItem {
  type: FormItemType;
  title?: string;
  description?: string;
  ref?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  options?: FormOption[];
  rows?: string[];
  columns?: string[];
  file_limits?: { max_files?: number; max_size_mb?: number };
  grading?: { points: number; correct: string[]; feedback?: string };
}

export interface FormOption {
  value: string;
  label?: string;
  logic?: { action: 'GOTO_REF' | 'NEXT_SECTION' | 'SUBMIT_FORM'; goto_ref?: string };
}

export interface FormEntityMapping {
  target_plugin: string;
  target_entity: string;
  target_field: string;
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
