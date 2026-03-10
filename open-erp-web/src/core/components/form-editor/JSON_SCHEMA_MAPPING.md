# JSON Schema Mapping Documentation

This document describes how the Form Editor's internal schema is mapped to standard JSON Schema format with UI extensions.

## Overview

The Form Editor uses an internal representation optimized for editing, then converts to JSON Schema (Draft 07) with vendor-specific UI extensions for export.

## Component to JSON Schema Type Mapping

### String Types

| Component Type | JSON Schema Type | UI Widget     |
| -------------- | ---------------- | ------------- |
| input          | string           | text          |
| textarea       | string           | textarea      |
| select         | string           | select        |
| autocomplete   | string           | autocomplete  |
| cascade-select | string           | cascadeSelect |
| color-picker   | string           | color         |
| date-picker    | string           | date          |
| radio-button   | string           | radio         |

### Boolean Types

| Component Type | JSON Schema Type | UI Widget    |
| -------------- | ---------------- | ------------ |
| checkbox       | boolean          | checkbox     |
| toggle-button  | boolean          | toggleButton |
| toggle-switch  | boolean          | toggleSwitch |

### Number Types

| Component Type | JSON Schema Type | UI Widget |
| -------------- | ---------------- | --------- |
| slider         | number           | slider    |
| rating         | number           | rating    |

### Layout Types

Layout components don't create properties but define the `ui:layout` structure.

| Component Type  | UI Layout Type          | Description          |
| --------------- | ----------------------- | -------------------- |
| layout-1-column | row                     | Single column layout |
| layout-2-column | row (columns: 2)        | Two column layout    |
| layout-3-column | row (columns: 3)        | Three column layout  |
| divider         | divider                 | Horizontal divider   |
| button          | column (widget: button) | Button element       |

## Validation Mapping

Form Editor validation rules map to JSON Schema validation keywords:

| Editor Validation | JSON Schema Keyword | Applies To   |
| ----------------- | ------------------- | ------------ |
| minLength         | minLength           | string types |
| maxLength         | maxLength           | string types |
| min               | minimum             | number types |
| max               | maximum             | number types |
| pattern           | pattern             | string types |
| email             | format: "email"     | string types |
| url               | format: "uri"       | string types |
| required          | required array      | all types    |

## UI Extensions

The editor adds vendor-specific extensions under the `ui:` prefix:

### Property-Level Extensions

```json
{
  "ui:widget": "text", // Widget type (text, select, checkbox, etc.)
  "ui:placeholder": "Enter text", // Placeholder text
  "ui:disabled": true, // Disabled state
  "ui:readonly": false, // Readonly state
  "ui:classNames": "custom-css", // CSS classes
  "ui:options": {
    // Additional options
    "enumLabels": ["Label 1", "Label 2"]
  }
}
```

### Schema-Level Extensions

```json
{
  "ui:order": ["field1", "field2"], // Field display order
  "ui:layout": [
    // Layout structure
    {
      "type": "row", // Layout type (row, column, divider)
      "columns": 2, // Number of columns
      "children": ["field1", "field2"], // Child field IDs or layouts
      "cssClasses": "custom-class" // CSS classes for layout
    }
  ]
}
```

## Example Mappings

### Simple Input Field

**Editor Schema:**

```json
{
  "id": "username",
  "type": "input",
  "label": "Username",
  "placeholder": "Enter username",
  "required": true,
  "validation": {
    "minLength": 3,
    "maxLength": 20
  }
}
```

**JSON Schema Output:**

```json
{
  "properties": {
    "username": {
      "type": "string",
      "title": "Username",
      "minLength": 3,
      "maxLength": 20,
      "ui:widget": "text",
      "ui:placeholder": "Enter username"
    }
  },
  "required": ["username"]
}
```

### Select with Options

**Editor Schema:**

```json
{
  "id": "country",
  "type": "select",
  "label": "Country",
  "options": [
    { "label": "USA", "value": "us" },
    { "label": "Canada", "value": "ca" }
  ]
}
```

**JSON Schema Output:**

```json
{
  "properties": {
    "country": {
      "type": "string",
      "title": "Country",
      "enum": ["us", "ca"],
      "ui:widget": "select",
      "ui:options": {
        "enumLabels": ["USA", "Canada"]
      }
    }
  }
}
```

### Layout with Fields

**Editor Schema:**

```json
{
  "id": "layout1",
  "type": "layout-2-column",
  "children": [
    {
      "id": "firstName",
      "type": "input",
      "label": "First Name"
    },
    {
      "id": "lastName",
      "type": "input",
      "label": "Last Name"
    }
  ]
}
```

**JSON Schema Output:**

```json
{
  "properties": {
    "firstName": {
      "type": "string",
      "title": "First Name",
      "ui:widget": "text"
    },
    "lastName": {
      "type": "string",
      "title": "Last Name",
      "ui:widget": "text"
    }
  },
  "ui:layout": [
    {
      "type": "row",
      "columns": 2,
      "children": ["firstName", "lastName"]
    }
  ]
}
```

### Checkbox with Validation

**Editor Schema:**

```json
{
  "id": "terms",
  "type": "checkbox",
  "label": "I accept terms",
  "required": true
}
```

**JSON Schema Output:**

```json
{
  "properties": {
    "terms": {
      "type": "boolean",
      "title": "I accept terms",
      "ui:widget": "checkbox"
    }
  },
  "required": ["terms"]
}
```

## i18n Support

Labels and placeholders can use i18n keys instead of literal strings:

**Editor Schema:**

```json
{
  "id": "email",
  "type": "input",
  "labelKey": "form.email.label",
  "placeholderKey": "form.email.placeholder"
}
```

**JSON Schema Output:**

```json
{
  "properties": {
    "email": {
      "type": "string",
      "title": "form.email.label",
      "ui:widget": "text",
      "ui:placeholder": "form.email.placeholder"
    }
  }
}
```

## Nested Layouts

Layouts can be nested to create complex structures:

```json
{
  "ui:layout": [
    {
      "type": "row",
      "columns": 2,
      "children": [
        "field1",
        {
          "type": "column",
          "children": ["field2", "field3"]
        }
      ]
    }
  ]
}
```

## Custom Extensions

The `ui:` prefix is used for all vendor extensions. Additional custom extensions can be added as needed:

```json
{
  "ui:help": "Help text for this field",
  "ui:autocomplete": "email",
  "ui:errorMessage": "Custom error message"
}
```

## Validation with AJV

The exported JSON Schema is validated using AJV before download to ensure it conforms to JSON Schema Draft 07 specification.

```typescript
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });
const valid = ajv.validateSchema(schema);
```

## Best Practices

1. **Use i18n keys** for labels and placeholders when building multi-language forms
2. **Set unique IDs** for all components to avoid conflicts
3. **Use layout components** to create structured, responsive forms
4. **Add validation rules** to ensure data quality
5. **Test exported schemas** with AJV before using in production
6. **Document custom extensions** if you add new UI properties

## Related Specifications

- [JSON Schema Draft 07](https://json-schema.org/draft-07/json-schema-release-notes.html)
- [react-jsonschema-form UI Schema](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema)
- [AJV - JSON Schema Validator](https://ajv.js.org/)
