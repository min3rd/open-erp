import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { MpToolbar } from '../toolbar';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { FormEditorService } from './form-editor.service';
import { FormEditorPalette } from './form-editor-palette';
import { FormEditorCanvas } from './form-editor-canvas';
import { FormEditorInspector } from './form-editor-inspector';
import { JSONSchemaConverter } from './json-schema-converter.service';
import { ComponentDefinition, COMPONENT_DEFINITIONS } from './component-definitions';
import { FormComponent } from './form-editor.types';

@Component({
  selector: 'core-form-editor',
  imports: [
    CommonModule,
    TranslocoModule,
    MpToolbar,
    Button,
    Tooltip,
    Toast,
    FormEditorPalette,
    FormEditorCanvas,
    FormEditorInspector,
  ],
  providers: [FormEditorService, JSONSchemaConverter, MessageService],
  templateUrl: './form-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditor {
  private editorService = inject(FormEditorService);
  private converter = inject(JSONSchemaConverter);
  private messageService = inject(MessageService);

  schema = this.editorService.schema;
  selectedComponentId = this.editorService.selectedComponentId;
  selectedComponent = this.editorService.selectedComponent;
  canUndo = this.editorService.canUndo;
  canRedo = this.editorService.canRedo;

  /**
   * Handle component selection from palette
   */
  onComponentSelected(component: ComponentDefinition): void {
    const id = this.editorService.addComponent(component.defaultConfig);
    this.editorService.selectComponent(id);
  }

  /**
   * Handle component drop from palette
   */
  onComponentDropped(event: {
    componentType: string;
    parentId: string | null;
    columnIndex: number;
    position: number;
  }): void {
    // Find component definition
    const component = this.findComponentDefinition(event.componentType);
    if (component) {
      const id = this.editorService.addComponent(
        component.defaultConfig,
        event.parentId || undefined,
        event.position >= 0 ? event.position : undefined,
      );
      this.editorService.selectComponent(id);
    }
  }

  /**
   * Handle moving existing component
   */
  onComponentMoved(event: {
    componentId: string;
    targetParentId: string | null;
    columnIndex: number;
    position: number;
  }): void {
    this.editorService.moveComponent(
      event.componentId,
      event.targetParentId,
      event.position >= 0 ? event.position : 0,
    );
  }

  /**
   * Handle add component button click
   */
  onAddComponentRequested(event: { parentId: string | null; position: number }): void {
    // For now, we'll just show a message. In the future, we can show a dropdown menu
    // For this implementation, we'll add a default input component
    const defaultComponent = this.findComponentDefinition('input');
    if (defaultComponent) {
      const id = this.editorService.addComponent(
        defaultComponent.defaultConfig,
        event.parentId || undefined,
        event.position >= 0 ? event.position : undefined,
      );
      this.editorService.selectComponent(id);
    }
  }

  /**
   * Handle component selection from canvas
   */
  onCanvasComponentSelected(component: FormComponent): void {
    this.editorService.selectComponent(component.id);
  }

  /**
   * Handle component property changes
   */
  onComponentChanged(component: FormComponent): void {
    this.editorService.updateComponent(component.id, component);
  }

  /**
   * Handle component removal
   */
  onComponentRemoved(componentId: string): void {
    this.editorService.removeComponent(componentId);
  }

  /**
   * Undo last action
   */
  undo(): void {
    this.editorService.undo();
  }

  /**
   * Redo next action
   */
  redo(): void {
    this.editorService.redo();
  }

  /**
   * Export schema
   */
  exportSchema(): void {
    try {
      const formSchema = this.editorService.getSchemaForExport();
      const jsonSchema = this.converter.convert(formSchema);

      // Validate schema
      const validation = this.converter.validate(jsonSchema);
      if (!validation.valid) {
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: validation.errors.join(', '),
          life: 5000,
        });
        return;
      }

      // Download schema
      this.converter.downloadSchema(jsonSchema);

      this.messageService.add({
        severity: 'success',
        summary: 'Export Successful',
        detail: 'Form schema exported successfully',
        life: 3000,
      });
    } catch (error) {
      console.error('Export failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
        life: 5000,
      });
    }
  }

  /**
   * Clear editor
   */
  clear(): void {
    if (confirm(this.getTranslation('formEditor.messages.clearConfirm'))) {
      this.editorService.clear();
      this.messageService.add({
        severity: 'info',
        summary: 'Cleared',
        detail: 'Form editor cleared',
        life: 3000,
      });
    }
  }

  /**
   * Find component definition by type
   */
  private findComponentDefinition(type: string): ComponentDefinition | undefined {
    return COMPONENT_DEFINITIONS.find((def) => def.type === type);
  }

  /**
   * Get translation (placeholder for actual implementation)
   */
  private getTranslation(key: string): string {
    // This is a placeholder - in real implementation, use TranslocoService
    return key;
  }
}
