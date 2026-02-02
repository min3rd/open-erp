/**
 * Form Editor Module
 * Exports all form editor components, services, and types
 */

// Main component
export { FormEditor } from './form-editor';

// Child components
export { FormEditorPalette } from './form-editor-palette';
export { FormEditorCanvas } from './form-editor-canvas';
export { FormEditorInspector } from './form-editor-inspector';

// Services
export { FormEditorService } from './form-editor.service';
export { JSONSchemaConverter } from './json-schema-converter.service';

// Types
export type {
  ComponentType,
  ComponentCategory,
  BaseComponentConfig,
  LayoutComponentConfig,
  FormFieldConfig,
  FormComponent,
  FormSchema,
  ActionType,
  EditorAction,
  EditorState,
  ComponentDefinition,
  JSONSchemaOutput,
  JSONSchemaProperty,
  UILayoutDefinition,
} from './form-editor.types';

// Constants
export {
  COMPONENT_DEFINITIONS,
  getComponentDefinition,
  getLayoutComponents,
  getFormComponents,
} from './component-definitions';
