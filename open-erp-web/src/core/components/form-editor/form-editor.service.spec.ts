import { TestBed } from '@angular/core/testing';
import { FormEditorService } from './form-editor.service';
import { FormSchema, ComponentType } from './form-editor.types';

describe('FormEditorService', () => {
  let service: FormEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormEditorService],
    });
    service = TestBed.inject(FormEditorService);
    
    // Clear localStorage before each test
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
  });

  afterEach(() => {
    // Clean up localStorage after each test
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial empty schema', () => {
    const schema = service.schema();
    expect(schema).toBeTruthy();
    expect(schema.components).toEqual([]);
  });

  describe('Add Component', () => {
    it('should add component to root', () => {
      const componentId = service.addComponent({
        type: 'input' as ComponentType,
        label: 'Test Input',
      });

      expect(componentId).toBeTruthy();
      const schema = service.schema();
      expect(schema.components.length).toBe(1);
      expect(schema.components[0].type).toBe('input');
      expect(schema.components[0].label).toBe('Test Input');
    });

    it('should add component to layout container', () => {
      const layoutId = service.addComponent({
        type: 'layout-1-column' as ComponentType,
      });

      const inputId = service.addComponent(
        {
          type: 'input' as ComponentType,
          label: 'Nested Input',
        },
        layoutId
      );

      const schema = service.schema();
      expect(schema.components.length).toBe(1);
      const layout: any = schema.components[0];
      expect(layout.children?.length).toBe(1);
      expect(layout.children?.[0].id).toBe(inputId);
    });
  });

  describe('Remove Component', () => {
    it('should remove component from root', () => {
      const componentId = service.addComponent({
        type: 'input' as ComponentType,
      });

      service.removeComponent(componentId);

      const schema = service.schema();
      expect(schema.components.length).toBe(0);
    });

    it('should remove component from layout container', () => {
      const layoutId = service.addComponent({
        type: 'layout-1-column' as ComponentType,
      });

      const inputId = service.addComponent(
        {
          type: 'input' as ComponentType,
        },
        layoutId
      );

      service.removeComponent(inputId);

      const schema = service.schema();
      const layout: any = schema.components[0];
      expect(layout.children?.length).toBe(0);
    });
  });

  describe('Update Component', () => {
    it('should update component properties', () => {
      const componentId = service.addComponent({
        type: 'input' as ComponentType,
        label: 'Original Label',
      });

      service.updateComponent(componentId, {
        label: 'Updated Label',
        required: true,
      });

      const schema = service.schema();
      const component = schema.components[0];
      expect(component.label).toBe('Updated Label');
      expect(component.required).toBe(true);
    });
  });

  describe('Component Selection', () => {
    it('should select component', () => {
      const componentId = service.addComponent({
        type: 'input' as ComponentType,
      });

      service.selectComponent(componentId);

      expect(service.selectedComponentId()).toBe(componentId);
      expect(service.selectedComponent()).toBeTruthy();
    });

    it('should deselect component', () => {
      const componentId = service.addComponent({
        type: 'input' as ComponentType,
      });

      service.selectComponent(componentId);
      service.selectComponent(null);

      expect(service.selectedComponentId()).toBeNull();
      expect(service.selectedComponent()).toBeNull();
    });
  });

  describe('Undo/Redo', () => {
    it('should undo add action', () => {
      const componentId = service.addComponent({
        type: 'input' as ComponentType,
      });

      expect(service.canUndo()).toBe(true);
      service.undo();

      const schema = service.schema();
      expect(schema.components.length).toBe(0);
    });

    it('should redo add action', () => {
      service.addComponent({
        type: 'input' as ComponentType,
      });

      service.undo();
      expect(service.canRedo()).toBe(true);
      
      service.redo();

      const schema = service.schema();
      expect(schema.components.length).toBe(1);
    });

    it('should undo update action', () => {
      const componentId = service.addComponent({
        type: 'input' as ComponentType,
        label: 'Original',
      });

      service.updateComponent(componentId, { label: 'Updated' });

      service.undo();

      const schema = service.schema();
      expect(schema.components[0].label).toBe('Original');
    });

    it('should track multiple actions', () => {
      service.addComponent({ type: 'input' as ComponentType });
      service.addComponent({ type: 'textarea' as ComponentType });
      service.addComponent({ type: 'select' as ComponentType });

      expect(service.schema().components.length).toBe(3);

      service.undo();
      expect(service.schema().components.length).toBe(2);

      service.undo();
      expect(service.schema().components.length).toBe(1);

      service.undo();
      expect(service.schema().components.length).toBe(0);
    });
  });

  describe('Move Component', () => {
    it('should move component between containers', () => {
      const layout1Id = service.addComponent({
        type: 'layout-1-column' as ComponentType,
      });

      const layout2Id = service.addComponent({
        type: 'layout-1-column' as ComponentType,
      });

      const inputId = service.addComponent(
        {
          type: 'input' as ComponentType,
        },
        layout1Id
      );

      service.moveComponent(inputId, layout2Id, 0);

      const schema = service.schema();
      const layout1: any = schema.components[0];
      const layout2: any = schema.components[1];

      expect(layout1.children?.length).toBe(0);
      expect(layout2.children?.length).toBe(1);
      expect(layout2.children?.[0].id).toBe(inputId);
    });
  });

  describe('Export', () => {
    it('should export schema', () => {
      service.addComponent({
        type: 'input' as ComponentType,
        label: 'Test',
      });

      const exported = service.getSchemaForExport();

      expect(exported).toBeTruthy();
      expect(exported.components.length).toBe(1);
    });
  });

  describe('Clear', () => {
    it('should clear editor state', () => {
      service.addComponent({ type: 'input' as ComponentType });
      service.addComponent({ type: 'textarea' as ComponentType });

      service.clear();

      const schema = service.schema();
      expect(schema.components.length).toBe(0);
    });
  });
});
