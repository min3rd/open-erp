# Form Editor Component

A comprehensive UI-only component for designing forms using JSON Schema. Built with Angular 21+ and PrimeNG 21+.

## Overview

The Form Editor is a WYSIWYG drag-and-drop form builder that allows users to:

- Design forms visually using a component palette
- Configure component properties in real-time
- Export forms as valid JSON Schema
- Undo/Redo all actions
- Persist state locally for continuity

## Features

### Component Palette

- **Layout Components**: 1-column, 2-column, 3-column layouts, dividers, buttons
- **Form Components**: Input, TextArea, Select, Checkbox, Radio Button, Date Picker, Autocomplete, Cascade Select, Color Picker, Rating, Slider, Select Button, Toggle Button, Toggle Switch

### Drag & Drop

- Drag components from the palette to the canvas
- Drop into layout containers for nested structures
- Visual feedback during drag operations

### Configuration Inspector

- Edit labels and placeholders (with i18n support)
- Configure validation rules
- Set CSS classes
- Mark fields as required or disabled
- Add default values and options

### Undo/Redo

- Full history tracking (configurable max depth: 50 actions)
- Support for add, remove, move, and edit operations
- Visual indication of undo/redo availability

### Export

- Generates valid JSON Schema (Draft 07)
- Includes vendor extensions for UI metadata
- Validates schema before export using AJV
- Downloads as `.json` file

### Persistence

- Auto-saves to localStorage
- Continues editing after page refresh
- Clear function to reset editor

## Usage

### Basic Usage

```typescript
import { FormEditor } from '@core/components/form-editor/form-editor';

@Component({
  selector: 'my-component',
  imports: [FormEditor],
  template: `
    <div class="h-screen">
      <core-form-editor />
    </div>
  `,
})
export class MyComponent {}
```

### Demo

Navigate to `/demo/form-editor` to see the Form Editor in action.

## Architecture

### Core Files

- **form-editor.types.ts**: TypeScript interfaces for all data structures
- **form-editor.service.ts**: State management with undo/redo logic
- **json-schema-converter.service.ts**: Converts editor schema to JSON Schema
- **component-definitions.ts**: Palette component definitions
- **form-editor-palette.ts**: Left panel component library
- **form-editor-canvas.ts**: Center canvas for WYSIWYG preview
- **form-editor-inspector.ts**: Right panel properties editor
- **form-editor.ts**: Main component orchestrating the UI

### State Management

The editor uses Angular signals for reactive state management:

- `schema`: Current form schema
- `selectedComponentId`: ID of selected component
- `selectedComponent`: Full selected component object
- `canUndo/canRedo`: Boolean flags for action availability
- `history`: Array of editor actions for undo/redo

### JSON Schema Output Format

The editor exports JSON Schema Draft 07 with vendor extensions for UI metadata:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "My Form",
  "properties": {
    "field-id": {
      "type": "string",
      "title": "Field Label",
      "minLength": 5,
      "ui:widget": "text",
      "ui:placeholder": "Enter text",
      "ui:classNames": "custom-class"
    }
  },
  "required": ["field-id"],
  "ui:order": ["field-id"],
  "ui:layout": [
    {
      "type": "row",
      "columns": 2,
      "children": ["field-id"]
    }
  ]
}
```

### Vendor Extensions

The editor uses the following vendor extensions in the JSON Schema:

- `ui:widget`: Specifies the widget type (text, select, checkbox, etc.)
- `ui:placeholder`: Placeholder text for form fields
- `ui:options`: Additional options (e.g., enum labels)
- `ui:disabled`: Disabled state
- `ui:classNames`: CSS classes to apply
- `ui:order`: Order of fields in the form
- `ui:layout`: Layout structure with rows and columns

## Accessibility

The Form Editor follows WCAG AA guidelines:

- All interactive elements have unique IDs
- ARIA labels for screen readers
- Keyboard navigation support
- Proper focus management
- Color contrast compliance

## i18n Support

All user-facing text is translatable via Transloco:

- Component labels and placeholders support i18n keys
- UI text in English and Spanish (extensible to more languages)
- Translation keys follow the pattern: `formEditor.*`

## Local Storage

The editor automatically saves state to localStorage with the key `form-editor-state`. This includes:

- Current form schema
- Selected component
- Action history
- History index

To clear stored state:

```typescript
// In your component
formEditorService.clear();
```

## API

### FormEditorService

```typescript
// Add component
addComponent(component: Partial<FormComponent>, parentId?: string, position?: number): string

// Remove component
removeComponent(componentId: string): void

// Update component
updateComponent(componentId: string, updates: Partial<FormComponent>): void

// Move component
moveComponent(componentId: string, newParentId: string | null, newPosition: number): void

// Select component
selectComponent(componentId: string | null): void

// Undo/Redo
undo(): void
redo(): void

// Export
getSchemaForExport(): FormSchema

// Load
loadSchema(schema: FormSchema): void

// Clear
clear(): void
```

### JSONSchemaConverter

```typescript
// Convert to JSON Schema
convert(formSchema: FormSchema): JSONSchemaOutput

// Validate JSON Schema
validate(schema: JSONSchemaOutput): { valid: boolean; errors: string[] }

// Export as JSON string
exportAsJSON(schema: JSONSchemaOutput, prettify?: boolean): string

// Download schema
downloadSchema(schema: JSONSchemaOutput, filename?: string): void
```

## Testing

Run unit tests:

```bash
npm test
```

The test suite covers:

- State management (add, remove, move, update)
- Undo/Redo functionality
- JSON Schema conversion
- Schema validation

## Dependencies

- **Angular**: ^21.0.0
- **PrimeNG**: ^21.0.2
- **Transloco**: ^8.2.0
- **AJV**: ^8.x (for JSON Schema validation)
- **Tailwind CSS**: ^4.1.12

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT
