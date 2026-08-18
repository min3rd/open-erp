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
    selector?: string;
    category: 'General' | 'Data Display' | 'Form & Inputs' | 'Feedback & Status' | 'Feedback & Loading' | 'Overlay & Popups' | 'Navigation & Utility' | 'Utilities & Misc';
    description: string;
    importStatement?: string;
    badge?: string;
    props: ComponentPropDoc[];
    examples: ComponentExampleDoc[];
}
