export enum FieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  FILE = 'FILE',
  GRID = 'GRID',
}

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

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    regEx?: string;
  };
  options?: Array<{ label: string; value: any }>;
  columns?: Array<{
    name: string;
    label: string;
    type: FieldType;
    required: boolean;
    options?: Array<{ label: string; value: any }>;
    validation?: any;
  }>;
  layout?: {
    colSpanDesktop?: number;
    colSpanTablet?: number;
    colSpanMobile?: number;
    panelId?: string;
  };
}
