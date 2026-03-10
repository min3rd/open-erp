/**
 * Form Editor Types
 * Defines the data structures for the JSON Schema Form Editor component
 */

/**
 * Component types available in the form editor
 */
export type ComponentType =
  // Layout components
  | 'layout-1-column'
  | 'layout-2-column'
  | 'layout-3-column'
  | 'divider'
  | 'button'
  // Form components
  | 'autocomplete'
  | 'cascade-select'
  | 'checkbox'
  | 'color-picker'
  | 'date-picker'
  | 'input'
  | 'radio-button'
  | 'rating'
  | 'select'
  | 'select-button'
  | 'slider'
  | 'textarea'
  | 'toggle-button'
  | 'toggle-switch';

/**
 * Component category for organizing in the left panel
 */
export type ComponentCategory = 'layout' | 'form';

/**
 * Base configuration for all components
 */
export interface BaseComponentConfig {
  id: string;
  type: ComponentType;
  label?: string;
  labelKey?: string; // i18n key for label
  placeholder?: string;
  placeholderKey?: string; // i18n key for placeholder
  cssClasses?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Layout component configuration (can contain children)
 */
export interface LayoutComponentConfig extends BaseComponentConfig {
  type: 'layout-1-column' | 'layout-2-column' | 'layout-3-column' | 'divider' | 'button';
  children?: FormComponent[];
}

/**
 * Form field component configuration
 */
export interface FormFieldConfig extends BaseComponentConfig {
  type: Exclude<
    ComponentType,
    'layout-1-column' | 'layout-2-column' | 'layout-3-column' | 'divider' | 'button'
  >;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    email?: boolean;
    url?: boolean;
    custom?: string; // Custom validation expression
  };
  defaultValue?: unknown;
  options?: Array<{ label: string; value: unknown; labelKey?: string }>;
}

/**
 * Union type for all component configs
 */
export type FormComponent = LayoutComponentConfig | FormFieldConfig;

/**
 * Root form schema
 */
export interface FormSchema {
  id: string;
  version: string;
  title?: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  components: FormComponent[];
  metadata?: Record<string, unknown>;
}

/**
 * Action types for undo/redo
 */
export type ActionType = 'add' | 'remove' | 'move' | 'edit' | 'init';

/**
 * Action for undo/redo history
 */
export interface EditorAction {
  type: ActionType;
  timestamp?: number;
  componentId?: string;
  previousState?: FormSchema;
  newState?: FormSchema;
  description?: string;
}

/**
 * Editor state
 */
export interface EditorState {
  schema: FormSchema;
  selectedComponentId: string | null;
  history: EditorAction[];
  historyIndex: number;
  maxHistoryDepth: number;
}

/**
 * Component definition for the palette
 */
export interface ComponentDefinition {
  type: ComponentType;
  category: ComponentCategory;
  labelKey: string;
  icon: string;
  defaultConfig: Partial<FormComponent>;
}

/**
 * JSON Schema output format
 */
export interface JSONSchemaOutput {
  $schema: string;
  type: 'object';
  title?: string;
  description?: string;
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  'ui:order'?: string[];
  'ui:layout'?: UILayoutDefinition[];
}

/**
 * JSON Schema property definition
 */
export interface JSONSchemaProperty {
  type: string | string[];
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  'ui:widget'?: string;
  'ui:placeholder'?: string;
  'ui:options'?: Record<string, unknown>;
  'ui:disabled'?: boolean;
  'ui:readonly'?: boolean;
  'ui:help'?: string;
  'ui:classNames'?: string;
}

/**
 * UI Layout definition for vendor extension
 */
export interface UILayoutDefinition {
  type: 'row' | 'column' | 'divider';
  columns?: number;
  children?: string[] | UILayoutDefinition[];
  widget?: string;
  cssClasses?: string;
}
