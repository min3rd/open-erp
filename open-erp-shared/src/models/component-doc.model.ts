export interface ComponentPropDoc {
  name: string;
  type: string;
  default: string;
  description: string;
  required?: boolean;
  options?: string[];
}

export interface ComponentExampleDoc {
  title: string;
  description: string;
  code: string;
}

export interface ComponentDoc {
  id: string;
  name: string;
  selector: string;
  category: 'General' | 'Data Display' | 'Form & Inputs' | 'Feedback & Loading' | 'Navigation & Utility';
  description: string;
  importStatement: string;
  props: ComponentPropDoc[];
  examples: ComponentExampleDoc[];
}
