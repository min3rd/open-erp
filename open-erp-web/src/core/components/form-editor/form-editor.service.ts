import { Injectable, signal, computed } from '@angular/core';
import {
  FormSchema,
  FormComponent,
  EditorState,
  EditorAction,
  ComponentType,
  LayoutComponentConfig,
} from './form-editor.types';

/**
 * Service for managing form editor state with undo/redo functionality
 */
@Injectable()
export class FormEditorService {
  private readonly DEFAULT_MAX_HISTORY = 50;
  private readonly STORAGE_KEY = 'form-editor-state';

  // State signals
  private state = signal<EditorState>(this.getInitialState());

  // Computed values
  schema = computed(() => this.state().schema);
  selectedComponentId = computed(() => this.state().selectedComponentId);
  canUndo = computed(() => this.state().historyIndex > 0);
  canRedo = computed(() => this.state().historyIndex < this.state().history.length - 1);
  selectedComponent = computed(() => {
    const id = this.selectedComponentId();
    if (!id) return null;
    return this.findComponentById(this.schema(), id);
  });

  /**
   * Get initial editor state
   */
  private getInitialState(): EditorState {
    // Try to load from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.schema) {
            return parsed;
          }
        } catch (e) {
          console.warn('Failed to parse stored form editor state:', e);
        }
      }
    }

    // Return default state
    const initialSchema: FormSchema = {
      id: 'form-' + Date.now(),
      version: '1.0.0',
      title: 'New Form',
      components: [],
    };

    return {
      schema: initialSchema,
      selectedComponentId: null,
      history: [
        {
          type: 'init',
          timestamp: Date.now(),
          newState: initialSchema,
          description: 'Initial state',
        },
      ],
      historyIndex: 0,
      maxHistoryDepth: this.DEFAULT_MAX_HISTORY,
    };
  }

  /**
   * Save current state to localStorage
   */
  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state()));
      } catch (e) {
        console.warn('Failed to save form editor state to localStorage:', e);
      }
    }
  }

  /**
   * Add action to history and update state
   */
  private addAction(action: EditorAction, newSchema: FormSchema): void {
    this.state.update((current) => {
      // Remove any actions after current index (for redo branch)
      const newHistory = current.history.slice(0, current.historyIndex + 1);

      // Add new action
      newHistory.push({
        ...action,
        timestamp: Date.now(),
        previousState: current.schema,
        newState: newSchema,
      });

      // Trim history if exceeds max depth
      if (newHistory.length > current.maxHistoryDepth) {
        newHistory.shift();
      }

      const newState = {
        ...current,
        schema: newSchema,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };

      this.saveToLocalStorage();
      return newState;
    });
  }

  /**
   * Find component by ID recursively
   */
  private findComponentById(
    schema: FormSchema | LayoutComponentConfig,
    id: string,
  ): FormComponent | null {
    const components = 'components' in schema ? schema.components : schema.children || [];

    for (const component of components) {
      if (component.id === id) {
        return component;
      }

      if ('children' in component && component.children) {
        const found = this.findComponentInArray(component.children, id);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Find component in array helper
   */
  private findComponentInArray(components: FormComponent[], id: string): FormComponent | null {
    for (const component of components) {
      if (component.id === id) {
        return component;
      }

      if ('children' in component && component.children) {
        const found = this.findComponentInArray(component.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Generate unique component ID
   */
  private generateComponentId(type: ComponentType): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Deep clone schema
   */
  private cloneSchema(schema: FormSchema): FormSchema {
    return JSON.parse(JSON.stringify(schema));
  }

  /**
   * Add component to schema
   */
  addComponent(component: Partial<FormComponent>, parentId?: string, position?: number): string {
    const newSchema = this.cloneSchema(this.schema());
    const id = this.generateComponentId(component.type as ComponentType);

    const newComponent: FormComponent = {
      ...component,
      id,
    } as FormComponent;

    if (parentId) {
      // Add to specific parent
      const parent = this.findComponentById(newSchema, parentId) as LayoutComponentConfig;
      if (parent && 'children' in parent) {
        parent.children = parent.children || [];
        if (position !== undefined) {
          parent.children.splice(position, 0, newComponent);
        } else {
          parent.children.push(newComponent);
        }
      }
    } else {
      // Add to root
      if (position !== undefined) {
        newSchema.components.splice(position, 0, newComponent);
      } else {
        newSchema.components.push(newComponent);
      }
    }

    this.addAction(
      {
        type: 'add',
        componentId: id,
        description: `Added ${component.type} component`,
      },
      newSchema,
    );

    return id;
  }

  /**
   * Remove component from schema
   */
  removeComponent(componentId: string): void {
    const newSchema = this.cloneSchema(this.schema());
    this.removeComponentFromSchema(newSchema, componentId);

    this.addAction(
      {
        type: 'remove',
        componentId,
        description: `Removed component ${componentId}`,
      },
      newSchema,
    );

    // Clear selection if removed component was selected
    if (this.selectedComponentId() === componentId) {
      this.selectComponent(null);
    }
  }

  /**
   * Remove component from schema helper
   */
  private removeComponentFromSchema(
    schema: FormSchema | LayoutComponentConfig,
    componentId: string,
  ): boolean {
    const components = 'components' in schema ? schema.components : schema.children || [];

    const index = components.findIndex((c) => c.id === componentId);
    if (index !== -1) {
      components.splice(index, 1);
      return true;
    }

    for (const component of components) {
      if ('children' in component && component.children) {
        if (this.removeComponentFromArray(component.children, componentId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Remove component from array helper
   */
  private removeComponentFromArray(components: FormComponent[], componentId: string): boolean {
    const index = components.findIndex((c) => c.id === componentId);
    if (index !== -1) {
      components.splice(index, 1);
      return true;
    }

    for (const component of components) {
      if ('children' in component && component.children) {
        if (this.removeComponentFromArray(component.children, componentId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Update component properties
   */
  updateComponent(componentId: string, updates: Partial<FormComponent>): void {
    const newSchema = this.cloneSchema(this.schema());
    const component = this.findComponentById(newSchema, componentId);

    if (component) {
      Object.assign(component, updates);

      this.addAction(
        {
          type: 'edit',
          componentId,
          description: `Updated component ${componentId}`,
        },
        newSchema,
      );
    }
  }

  /**
   * Move component to new position
   */
  moveComponent(componentId: string, newParentId: string | null, newPosition: number): void {
    const newSchema = this.cloneSchema(this.schema());

    // Find and remove from current position
    const component = this.findComponentById(newSchema, componentId);
    if (!component) return;

    const componentCopy = { ...component };
    this.removeComponentFromSchema(newSchema, componentId);

    // Add to new position
    if (newParentId) {
      const parent = this.findComponentById(newSchema, newParentId) as LayoutComponentConfig;
      if (parent && 'children' in parent) {
        parent.children = parent.children || [];
        parent.children.splice(newPosition, 0, componentCopy);
      }
    } else {
      newSchema.components.splice(newPosition, 0, componentCopy);
    }

    this.addAction(
      {
        type: 'move',
        componentId,
        description: `Moved component ${componentId}`,
      },
      newSchema,
    );
  }

  /**
   * Select component for editing
   */
  selectComponent(componentId: string | null): void {
    this.state.update((current) => ({
      ...current,
      selectedComponentId: componentId,
    }));
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (!this.canUndo()) return;

    this.state.update((current) => {
      const newIndex = current.historyIndex - 1;
      const action = current.history[newIndex];

      return {
        ...current,
        schema: action.newState!,
        historyIndex: newIndex,
      };
    });

    this.saveToLocalStorage();
  }

  /**
   * Redo next action
   */
  redo(): void {
    if (!this.canRedo()) return;

    this.state.update((current) => {
      const newIndex = current.historyIndex + 1;
      const action = current.history[newIndex];

      return {
        ...current,
        schema: action.newState!,
        historyIndex: newIndex,
      };
    });

    this.saveToLocalStorage();
  }

  /**
   * Clear editor state
   */
  clear(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.STORAGE_KEY);
    }

    this.state.set(this.getInitialState());
  }

  /**
   * Load schema
   */
  loadSchema(schema: FormSchema): void {
    this.addAction(
      {
        type: 'init',
        description: 'Loaded schema',
      },
      schema,
    );
  }

  /**
   * Get current schema for export
   */
  getSchemaForExport(): FormSchema {
    return this.cloneSchema(this.schema());
  }
}
