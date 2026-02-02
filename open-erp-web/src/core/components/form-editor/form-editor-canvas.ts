import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { FormComponent, LayoutComponentConfig, FormFieldConfig } from './form-editor.types';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import { RadioButton } from 'primeng/radiobutton';
import { DatePicker } from 'primeng/datepicker';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { AutoComplete } from 'primeng/autocomplete';
import { ColorPicker } from 'primeng/colorpicker';
import { Rating } from 'primeng/rating';
import { Slider } from 'primeng/slider';
import { SelectButton } from 'primeng/selectbutton';
import { ToggleButton } from 'primeng/togglebutton';
import { ToggleSwitch } from 'primeng/toggleswitch';

@Component({
  selector: 'form-editor-canvas',
  imports: [
    CommonModule,
    TranslocoModule,
    InputText,
    Textarea,
    Select,
    Checkbox,
    RadioButton,
    DatePicker,
    Button,
    Divider,
    AutoComplete,
    ColorPicker,
    Rating,
    Slider,
    SelectButton,
    ToggleButton,
    ToggleSwitch,
  ],
  templateUrl: './form-editor-canvas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorCanvas {
  components = input<FormComponent[]>([]);
  selectedComponentId = input<string | null>(null);

  componentSelected = output<FormComponent>();
  componentDropped = output<{ componentType: string; parentId: string | null; columnIndex: number; position: number }>();
  componentMoved = output<{ componentId: string; targetParentId: string | null; columnIndex: number; position: number }>();
  addComponentRequested = output<{ parentId: string | null; position: number }>();

  private draggedComponent: FormComponent | null = null;

  isLayoutComponent(component: FormComponent): boolean {
    return [
      'layout-1-column',
      'layout-2-column',
      'layout-3-column',
      'divider',
      'button',
    ].includes(component.type);
  }

  getLayoutChildren(component: FormComponent): FormComponent[] {
    if (this.isLayoutComponent(component)) {
      const layoutComp = component as LayoutComponentConfig;
      return layoutComp.children || [];
    }
    return [];
  }

  getColumnIndices(component: FormComponent): number[] {
    if (component.type === 'layout-2-column') {
      return [0, 1];
    } else if (component.type === 'layout-3-column') {
      return [0, 1, 2];
    }
    return [0];
  }

  getColumnChildren(component: FormComponent, columnIndex: number): FormComponent[] {
    const children = this.getLayoutChildren(component);
    // For now, we'll distribute children evenly across columns
    // In the future, we can store column information in the component
    const colCount = this.getColumnCount(component);
    return children.filter((_, idx) => idx % colCount === columnIndex);
  }

  getColumnCount(component: FormComponent): number {
    if (component.type === 'layout-2-column') return 2;
    if (component.type === 'layout-3-column') return 3;
    return 1;
  }

  getLayoutClasses(component: FormComponent): string {
    if (component.cssClasses) {
      return component.cssClasses;
    }
    return this.getDefaultLayoutClasses(component);
  }

  getDefaultLayoutClasses(component: FormComponent): string {
    if (component.type === 'layout-2-column') {
      return 'grid grid-cols-2 gap-4';
    } else if (component.type === 'layout-3-column') {
      return 'grid grid-cols-3 gap-4';
    }
    return '';
  }

  onComponentClick(event: MouseEvent, component: FormComponent): void {
    event.stopPropagation();
    this.componentSelected.emit(component);
  }

  onComponentDragStart(event: DragEvent, component: FormComponent): void {
    event.stopPropagation();
    this.draggedComponent = component;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify({
        isExisting: true,
        componentId: component.id
      }));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.draggedComponent ? 'move' : 'copy';
    }
  }

  onDrop(event: DragEvent, parentId: string | null, columnIndex: number): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      const data = event.dataTransfer.getData('application/json');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.isExisting) {
            // Moving existing component
            this.componentMoved.emit({
              componentId: parsed.componentId,
              targetParentId: parentId,
              columnIndex,
              position: -1 // Will be appended
            });
          } else {
            // Adding new component from palette
            this.componentDropped.emit({
              componentType: parsed.type,
              parentId,
              columnIndex,
              position: -1
            });
          }
        } catch (e) {
          console.error('Failed to parse dropped data:', e);
        }
      }
    }

    this.draggedComponent = null;
  }

  onAddComponentClick(event: MouseEvent, parentId: string | null = null, position: number = -1): void {
    event.stopPropagation();
    this.addComponentRequested.emit({ parentId, position });
  }
}
