import Ajv from 'ajv';
import {
  FormSchema,
  FormComponent,
  JSONSchemaOutput,
  JSONSchemaProperty,
  UILayoutDefinition,
  LayoutComponentConfig,
  FormFieldConfig,
} from './form-editor.types';

/**
 * Service for converting form editor schema to JSON Schema and validation
 */
export class JSONSchemaConverter {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
  }

  /**
   * Convert form editor schema to JSON Schema
   */
  convert(formSchema: FormSchema): JSONSchemaOutput {
    const properties: Record<string, JSONSchemaProperty> = {};
    const required: string[] = [];
    const uiOrder: string[] = [];
    const uiLayout: UILayoutDefinition[] = [];

    // Process all components
    this.processComponents(formSchema.components, properties, required, uiOrder, uiLayout);

    const jsonSchema: JSONSchemaOutput = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties,
      'ui:layout': uiLayout,
    };

    if (formSchema.title || formSchema.titleKey) {
      jsonSchema.title = formSchema.title || formSchema.titleKey;
    }

    if (formSchema.description || formSchema.descriptionKey) {
      jsonSchema.description = formSchema.description || formSchema.descriptionKey;
    }

    if (required.length > 0) {
      jsonSchema.required = required;
    }

    if (uiOrder.length > 0) {
      jsonSchema['ui:order'] = uiOrder;
    }

    return jsonSchema;
  }

  /**
   * Process components recursively
   */
  private processComponents(
    components: FormComponent[],
    properties: Record<string, JSONSchemaProperty>,
    required: string[],
    uiOrder: string[],
    uiLayout: UILayoutDefinition[]
  ): void {
    for (const component of components) {
      if (this.isLayoutComponent(component)) {
        const layoutDef = this.convertLayoutComponent(
          component as LayoutComponentConfig,
          properties,
          required,
          uiOrder
        );
        uiLayout.push(layoutDef);
      } else {
        const fieldDef = this.convertFormField(component as FormFieldConfig);
        properties[component.id] = fieldDef;
        uiOrder.push(component.id);

        if (component.required || (component as FormFieldConfig).validation?.required) {
          required.push(component.id);
        }
      }
    }
  }

  /**
   * Check if component is a layout component
   */
  private isLayoutComponent(component: FormComponent): boolean {
    return [
      'layout-1-column',
      'layout-2-column',
      'layout-3-column',
      'divider',
      'button',
    ].includes(component.type);
  }

  /**
   * Convert layout component
   */
  private convertLayoutComponent(
    component: LayoutComponentConfig,
    properties: Record<string, JSONSchemaProperty>,
    required: string[],
    uiOrder: string[]
  ): UILayoutDefinition {
    const layout: UILayoutDefinition = {
      type: component.type === 'divider' ? 'divider' : 'row',
    };

    if (component.type === 'layout-2-column') {
      layout.columns = 2;
    } else if (component.type === 'layout-3-column') {
      layout.columns = 3;
    } else if (component.type === 'button') {
      layout.widget = 'button';
      layout.type = 'column';
    }

    if (component.cssClasses) {
      layout.cssClasses = component.cssClasses;
    }

    if (component.children && component.children.length > 0) {
      const childrenIds: string[] = [];
      const childLayouts: UILayoutDefinition[] = [];

      for (const child of component.children) {
        if (this.isLayoutComponent(child)) {
          const childLayout = this.convertLayoutComponent(
            child as LayoutComponentConfig,
            properties,
            required,
            uiOrder
          );
          childLayouts.push(childLayout);
        } else {
          const fieldDef = this.convertFormField(child as FormFieldConfig);
          properties[child.id] = fieldDef;
          childrenIds.push(child.id);

          if (child.required || (child as FormFieldConfig).validation?.required) {
            required.push(child.id);
          }
        }
      }

      if (childrenIds.length > 0 || childLayouts.length > 0) {
        // Mix children IDs and layout definitions
        layout.children = [...childrenIds, ...childLayouts] as any;
      }
    }

    return layout;
  }

  /**
   * Convert form field component
   */
  private convertFormField(component: FormFieldConfig): JSONSchemaProperty {
    const property: JSONSchemaProperty = {
      type: this.mapComponentTypeToJSONSchemaType(component.type),
    };

    // Title
    if (component.label || component.labelKey) {
      property.title = component.label || component.labelKey;
    }

    // Default value
    if (component.defaultValue !== undefined) {
      property.default = component.defaultValue;
    }

    // UI widget
    property['ui:widget'] = this.mapComponentTypeToWidget(component.type);

    // Placeholder
    if (component.placeholder || component.placeholderKey) {
      property['ui:placeholder'] = component.placeholder || component.placeholderKey;
    }

    // CSS classes
    if (component.cssClasses) {
      property['ui:classNames'] = component.cssClasses;
    }

    // Disabled
    if (component.disabled) {
      property['ui:disabled'] = true;
    }

    // Options for select-type components
    if (component.options && component.options.length > 0) {
      property.enum = component.options.map((opt) => opt.value);
      property['ui:options'] = {
        enumLabels: component.options.map((opt) => opt.label || opt.labelKey || String(opt.value)),
      };
    }

    // Validation
    if (component.validation) {
      const val = component.validation;

      if (val.minLength !== undefined) {
        property.minLength = val.minLength;
      }
      if (val.maxLength !== undefined) {
        property.maxLength = val.maxLength;
      }
      if (val.min !== undefined) {
        property.minimum = val.min;
      }
      if (val.max !== undefined) {
        property.maximum = val.max;
      }
      if (val.pattern) {
        property.pattern = val.pattern;
      }
      if (val.email) {
        property.format = 'email';
      }
      if (val.url) {
        property.format = 'uri';
      }
    }

    return property;
  }

  /**
   * Map component type to JSON Schema type
   */
  private mapComponentTypeToJSONSchemaType(type: string): string {
    switch (type) {
      case 'input':
      case 'textarea':
      case 'autocomplete':
      case 'select':
      case 'cascade-select':
      case 'select-button':
      case 'radio-button':
      case 'color-picker':
      case 'date-picker':
        return 'string';
      case 'checkbox':
      case 'toggle-button':
      case 'toggle-switch':
        return 'boolean';
      case 'slider':
      case 'rating':
        return 'number';
      default:
        return 'string';
    }
  }

  /**
   * Map component type to UI widget
   */
  private mapComponentTypeToWidget(type: string): string {
    const widgetMap: Record<string, string> = {
      input: 'text',
      textarea: 'textarea',
      select: 'select',
      checkbox: 'checkbox',
      'radio-button': 'radio',
      'date-picker': 'date',
      autocomplete: 'autocomplete',
      'cascade-select': 'cascadeSelect',
      'color-picker': 'color',
      rating: 'rating',
      'select-button': 'selectButton',
      slider: 'slider',
      'toggle-button': 'toggleButton',
      'toggle-switch': 'toggleSwitch',
    };

    return widgetMap[type] || 'text';
  }

  /**
   * Validate JSON Schema
   */
  validate(schema: JSONSchemaOutput): { valid: boolean; errors: string[] } {
    try {
      // Validate against JSON Schema meta-schema
      const valid = this.ajv.validateSchema(schema);

      if (!valid && this.ajv.errors) {
        return {
          valid: false,
          errors: this.ajv.errors.map((err) => `${err.instancePath} ${err.message}`),
        };
      }

      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
      };
    }
  }

  /**
   * Export schema as JSON string
   */
  exportAsJSON(schema: JSONSchemaOutput, prettify = true): string {
    return prettify ? JSON.stringify(schema, null, 2) : JSON.stringify(schema);
  }

  /**
   * Download schema as file
   */
  downloadSchema(schema: JSONSchemaOutput, filename = 'form-schema.json'): void {
    const json = this.exportAsJSON(schema);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }
}
