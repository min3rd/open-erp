// =============================================
// Enums
// =============================================

export enum FieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  DATE_RANGE = 'DATE_RANGE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  CHECKBOX = 'CHECKBOX',
  CHECKBOX_GROUP = 'CHECKBOX_GROUP',
  RADIO = 'RADIO',
  TOGGLE = 'TOGGLE',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  GRID = 'GRID',
}

// =============================================
// Layout Interfaces
// =============================================

export interface LayoutColumn {
  fieldId?: string;
  colSpanDesktop?: number; // 1-12 span
  colSpanTablet?: number;
  colSpanMobile?: number;
  margin?: string;
  padding?: string;
  border?: string;
}

export interface LayoutRow {
  columns: LayoutColumn[];
  panelId?: string;
}

export interface FormLayout {
  rows: LayoutRow[];
}

// =============================================
// Validation
// =============================================

export type ValidationRuleType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'min'
  | 'max'
  | 'email'
  | 'url'
  | 'custom';

export interface ValidationRule {
  type: ValidationRuleType;
  value?: unknown;
  message: string; // plain text hoặc i18n key
}

// =============================================
// Conditional Logic
// =============================================

export type ConditionalOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'empty'
  | 'notEmpty';

export type ConditionalAction =
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'require'
  | 'setValue'
  | 'triggerApi';

export interface ConditionalRule {
  when: {
    field: string;               // key của field nguồn
    operator: ConditionalOperator;
    value?: unknown;
  };
  then: {
    action: ConditionalAction;
    target: string;              // key của field đích
    value?: unknown;             // giá trị khi action = 'setValue'
  };
}

// =============================================
// API Config (cho api-select, cascading)
// =============================================

export interface ApiConfig {
  endpoint: string;              // e.g. '/api/v1/locations/cities'
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, string>; // hỗ trợ {{fieldKey}} template
  labelKey: string;              // key trong response JSON làm label
  valueKey: string;              // key trong response JSON làm value
  dependsOn?: string;            // key của field trigger reload
}

// =============================================
// Grid Column Definition
// =============================================

export interface GridColumnDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: OptionItem[];
  validation?: ValidationRule[];
  apiConfig?: ApiConfig;
}

// =============================================
// Option Item (cho select, radio, checkbox-group)
// =============================================

export interface OptionItem {
  label: string;
  value: unknown;
  disabled?: boolean;
  icon?: string;
}

// =============================================
// FormField — schema của từng trường
// =============================================

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  validation?: ValidationRule[];
  options?: OptionItem[];
  apiConfig?: ApiConfig;
  columns?: GridColumnDef[];     // dành cho GRID
  layout?: {
    colSpanDesktop?: number;
    colSpanTablet?: number;
    colSpanMobile?: number;
    panelId?: string;
  };
  conditionalRules?: ConditionalRule[];
  helperText?: string;
  unit?: string;                 // đơn vị hiển thị bên cạnh NUMBER field
  accept?: string;               // MIME types cho FILE field (e.g. '.pdf,.docx')
  multiple?: boolean;            // FILE: cho phép chọn nhiều file
  meta?: Record<string, unknown>;
}

// =============================================
// FormSchema — full schema của một form
// =============================================

export interface FormSchema {
  id: string;
  version?: number;
  title?: string;
  description?: string;
  fields: FormField[];
  layout?: FormLayout;
  submitEndpoint?: string;
}
