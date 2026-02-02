import { ComponentDefinition, ComponentType } from './form-editor.types';

// Re-export for convenience
export type { ComponentDefinition, ComponentType };

/**
 * Component palette definitions
 * Defines all available components for the form editor
 */
export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // Layout Components
  {
    type: 'layout-1-column',
    category: 'layout',
    labelKey: 'formEditor.components.layout1Column',
    icon: 'pi pi-align-justify',
    defaultConfig: {
      type: 'layout-1-column',
      children: [],
      cssClasses: 'w-full',
    },
  },
  {
    type: 'layout-2-column',
    category: 'layout',
    labelKey: 'formEditor.components.layout2Column',
    icon: 'pi pi-align-left',
    defaultConfig: {
      type: 'layout-2-column',
      children: [],
      cssClasses: 'grid grid-cols-2 gap-4',
    },
  },
  {
    type: 'layout-3-column',
    category: 'layout',
    labelKey: 'formEditor.components.layout3Column',
    icon: 'pi pi-th-large',
    defaultConfig: {
      type: 'layout-3-column',
      children: [],
      cssClasses: 'grid grid-cols-3 gap-4',
    },
  },
  {
    type: 'divider',
    category: 'layout',
    labelKey: 'formEditor.components.divider',
    icon: 'pi pi-minus',
    defaultConfig: {
      type: 'divider',
      cssClasses: 'my-4',
    },
  },
  {
    type: 'button',
    category: 'layout',
    labelKey: 'formEditor.components.button',
    icon: 'pi pi-circle',
    defaultConfig: {
      type: 'button',
      label: 'Button',
      labelKey: 'formEditor.defaults.button',
    },
  },

  // Form Components
  {
    type: 'input',
    category: 'form',
    labelKey: 'formEditor.components.input',
    icon: 'pi pi-pencil',
    defaultConfig: {
      type: 'input',
      label: 'Input Field',
      labelKey: 'formEditor.defaults.input',
      placeholder: 'Enter text',
      placeholderKey: 'formEditor.defaults.inputPlaceholder',
    },
  },
  {
    type: 'textarea',
    category: 'form',
    labelKey: 'formEditor.components.textarea',
    icon: 'pi pi-align-left',
    defaultConfig: {
      type: 'textarea',
      label: 'Text Area',
      labelKey: 'formEditor.defaults.textarea',
      placeholder: 'Enter text',
      placeholderKey: 'formEditor.defaults.textareaPlaceholder',
    },
  },
  {
    type: 'select',
    category: 'form',
    labelKey: 'formEditor.components.select',
    icon: 'pi pi-list',
    defaultConfig: {
      type: 'select',
      label: 'Select',
      labelKey: 'formEditor.defaults.select',
      placeholder: 'Choose option',
      placeholderKey: 'formEditor.defaults.selectPlaceholder',
      options: [],
    },
  },
  {
    type: 'checkbox',
    category: 'form',
    labelKey: 'formEditor.components.checkbox',
    icon: 'pi pi-check-square',
    defaultConfig: {
      type: 'checkbox',
      label: 'Checkbox',
      labelKey: 'formEditor.defaults.checkbox',
    },
  },
  {
    type: 'radio-button',
    category: 'form',
    labelKey: 'formEditor.components.radioButton',
    icon: 'pi pi-circle',
    defaultConfig: {
      type: 'radio-button',
      label: 'Radio Button',
      labelKey: 'formEditor.defaults.radioButton',
      options: [],
    },
  },
  {
    type: 'date-picker',
    category: 'form',
    labelKey: 'formEditor.components.datePicker',
    icon: 'pi pi-calendar',
    defaultConfig: {
      type: 'date-picker',
      label: 'Date Picker',
      labelKey: 'formEditor.defaults.datePicker',
      placeholder: 'Select date',
      placeholderKey: 'formEditor.defaults.datePickerPlaceholder',
    },
  },
  {
    type: 'autocomplete',
    category: 'form',
    labelKey: 'formEditor.components.autocomplete',
    icon: 'pi pi-search',
    defaultConfig: {
      type: 'autocomplete',
      label: 'Autocomplete',
      labelKey: 'formEditor.defaults.autocomplete',
      placeholder: 'Search...',
      placeholderKey: 'formEditor.defaults.autocompletePlaceholder',
      options: [],
    },
  },
  {
    type: 'cascade-select',
    category: 'form',
    labelKey: 'formEditor.components.cascadeSelect',
    icon: 'pi pi-sitemap',
    defaultConfig: {
      type: 'cascade-select',
      label: 'Cascade Select',
      labelKey: 'formEditor.defaults.cascadeSelect',
      placeholder: 'Select option',
      placeholderKey: 'formEditor.defaults.cascadeSelectPlaceholder',
      options: [],
    },
  },
  {
    type: 'color-picker',
    category: 'form',
    labelKey: 'formEditor.components.colorPicker',
    icon: 'pi pi-palette',
    defaultConfig: {
      type: 'color-picker',
      label: 'Color Picker',
      labelKey: 'formEditor.defaults.colorPicker',
    },
  },
  {
    type: 'rating',
    category: 'form',
    labelKey: 'formEditor.components.rating',
    icon: 'pi pi-star',
    defaultConfig: {
      type: 'rating',
      label: 'Rating',
      labelKey: 'formEditor.defaults.rating',
    },
  },
  {
    type: 'select-button',
    category: 'form',
    labelKey: 'formEditor.components.selectButton',
    icon: 'pi pi-bars',
    defaultConfig: {
      type: 'select-button',
      label: 'Select Button',
      labelKey: 'formEditor.defaults.selectButton',
      options: [],
    },
  },
  {
    type: 'slider',
    category: 'form',
    labelKey: 'formEditor.components.slider',
    icon: 'pi pi-sliders-h',
    defaultConfig: {
      type: 'slider',
      label: 'Slider',
      labelKey: 'formEditor.defaults.slider',
    },
  },
  {
    type: 'toggle-button',
    category: 'form',
    labelKey: 'formEditor.components.toggleButton',
    icon: 'pi pi-pause',
    defaultConfig: {
      type: 'toggle-button',
      label: 'Toggle Button',
      labelKey: 'formEditor.defaults.toggleButton',
    },
  },
  {
    type: 'toggle-switch',
    category: 'form',
    labelKey: 'formEditor.components.toggleSwitch',
    icon: 'pi pi-power-off',
    defaultConfig: {
      type: 'toggle-switch',
      label: 'Toggle Switch',
      labelKey: 'formEditor.defaults.toggleSwitch',
    },
  },
];

/**
 * Get component definition by type
 */
export function getComponentDefinition(type: ComponentType): ComponentDefinition | undefined {
  return COMPONENT_DEFINITIONS.find((def) => def.type === type);
}

/**
 * Get all layout components
 */
export function getLayoutComponents(): ComponentDefinition[] {
  return COMPONENT_DEFINITIONS.filter((def) => def.category === 'layout');
}

/**
 * Get all form components
 */
export function getFormComponents(): ComponentDefinition[] {
  return COMPONENT_DEFINITIONS.filter((def) => def.category === 'form');
}
