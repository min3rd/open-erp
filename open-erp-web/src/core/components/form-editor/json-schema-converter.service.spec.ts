import { JSONSchemaConverter } from './json-schema-converter.service';
import { FormSchema, FormFieldConfig } from './form-editor.types';

describe('JSONSchemaConverter', () => {
  let converter: JSONSchemaConverter;

  beforeEach(() => {
    converter = new JSONSchemaConverter();
  });

  it('should create', () => {
    expect(converter).toBeTruthy();
  });

  describe('Convert', () => {
    it('should convert simple form to JSON Schema', () => {
      const formSchema: FormSchema = {
        id: 'test-form',
        version: '1.0.0',
        title: 'Test Form',
        components: [
          {
            id: 'field1',
            type: 'input',
            label: 'Name',
            required: true,
          } as FormFieldConfig,
        ],
      };

      const jsonSchema = converter.convert(formSchema);

      expect(jsonSchema).toBeTruthy();
      expect(jsonSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(jsonSchema.type).toBe('object');
      expect(jsonSchema.title).toBe('Test Form');
      expect(jsonSchema.properties['field1']).toBeTruthy();
      expect(jsonSchema.properties['field1'].type).toBe('string');
      expect(jsonSchema.required).toContain('field1');
    });

    it('should map component types correctly', () => {
      const formSchema: FormSchema = {
        id: 'test-form',
        version: '1.0.0',
        components: [
          {
            id: 'text1',
            type: 'input',
          } as FormFieldConfig,
          {
            id: 'checkbox1',
            type: 'checkbox',
          } as FormFieldConfig,
          {
            id: 'slider1',
            type: 'slider',
          } as FormFieldConfig,
        ],
      };

      const jsonSchema = converter.convert(formSchema);

      expect(jsonSchema.properties['text1'].type).toBe('string');
      expect(jsonSchema.properties['checkbox1'].type).toBe('boolean');
      expect(jsonSchema.properties['slider1'].type).toBe('number');
    });

    it('should include validation rules', () => {
      const formSchema: FormSchema = {
        id: 'test-form',
        version: '1.0.0',
        components: [
          {
            id: 'field1',
            type: 'input',
            validation: {
              minLength: 5,
              maxLength: 50,
              pattern: '^[a-z]+$',
              email: true,
            },
          } as FormFieldConfig,
        ],
      };

      const jsonSchema = converter.convert(formSchema);

      const prop = jsonSchema.properties['field1'];
      expect(prop.minLength).toBe(5);
      expect(prop.maxLength).toBe(50);
      expect(prop.pattern).toBe('^[a-z]+$');
      expect(prop.format).toBe('email');
    });

    it('should include UI extensions', () => {
      const formSchema: FormSchema = {
        id: 'test-form',
        version: '1.0.0',
        components: [
          {
            id: 'field1',
            type: 'input',
            placeholder: 'Enter name',
            cssClasses: 'custom-class',
            disabled: true,
          } as FormFieldConfig,
        ],
      };

      const jsonSchema = converter.convert(formSchema);

      const prop = jsonSchema.properties['field1'];
      expect(prop['ui:placeholder']).toBe('Enter name');
      expect(prop['ui:classNames']).toBe('custom-class');
      expect(prop['ui:disabled']).toBe(true);
      expect(prop['ui:widget']).toBe('text');
    });

    it('should handle layout components', () => {
      const formSchema: FormSchema = {
        id: 'test-form',
        version: '1.0.0',
        components: [
          {
            id: 'layout1',
            type: 'layout-2-column',
            children: [
              {
                id: 'field1',
                type: 'input',
              } as FormFieldConfig,
              {
                id: 'field2',
                type: 'textarea',
              } as FormFieldConfig,
            ],
          },
        ],
      };

      const jsonSchema = converter.convert(formSchema);

      expect(jsonSchema['ui:layout']).toBeTruthy();
      expect(jsonSchema['ui:layout']?.length).toBe(1);
      expect(jsonSchema['ui:layout']?.[0].type).toBe('row');
      expect(jsonSchema['ui:layout']?.[0].columns).toBe(2);
    });

    it('should handle options for select components', () => {
      const formSchema: FormSchema = {
        id: 'test-form',
        version: '1.0.0',
        components: [
          {
            id: 'field1',
            type: 'select',
            options: [
              { label: 'Option 1', value: 'opt1' },
              { label: 'Option 2', value: 'opt2' },
            ],
          } as FormFieldConfig,
        ],
      };

      const jsonSchema = converter.convert(formSchema);

      const prop = jsonSchema.properties['field1'];
      expect(prop.enum).toEqual(['opt1', 'opt2']);
      expect(prop['ui:options']?.enumLabels).toEqual(['Option 1', 'Option 2']);
    });
  });

  describe('Validate', () => {
    it('should validate valid JSON Schema', () => {
      const formSchema: FormSchema = {
        id: 'test-form',
        version: '1.0.0',
        components: [
          {
            id: 'field1',
            type: 'input',
          } as FormFieldConfig,
        ],
      };

      const jsonSchema = converter.convert(formSchema);
      const result = converter.validate(jsonSchema);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Export', () => {
    it('should export as JSON string', () => {
      const formSchema: FormSchema = {
        id: 'test-form',
        version: '1.0.0',
        components: [
          {
            id: 'field1',
            type: 'input',
          } as FormFieldConfig,
        ],
      };

      const jsonSchema = converter.convert(formSchema);
      const json = converter.exportAsJSON(jsonSchema);

      expect(json).toBeTruthy();
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });

    it('should prettify JSON', () => {
      const formSchema: FormSchema = {
        id: 'test-form',
        version: '1.0.0',
        components: [
          {
            id: 'field1',
            type: 'input',
          } as FormFieldConfig,
        ],
      };

      const jsonSchema = converter.convert(formSchema);
      const json = converter.exportAsJSON(jsonSchema, true);

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });
});
