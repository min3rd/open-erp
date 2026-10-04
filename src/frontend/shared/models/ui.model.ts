export interface TableColumn {
  key: string;
  labelKey: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  mono?: boolean;
}

export interface SelectOption {
  value: string;
  labelKey?: string;
  label?: string;
  disabled?: boolean;
}
