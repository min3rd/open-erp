export interface TableColumn {
  key: string;
  labelKey: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  mono?: boolean;
}

export interface TableRowContext {
  $implicit: any;
  index: number;
}

export interface SelectOption {
  value: string;
  labelKey?: string;
  label?: string;
  disabled?: boolean;
}

export interface AccordionGroup {
  key: string;
  labelKey: string;
  items: any[];
}
