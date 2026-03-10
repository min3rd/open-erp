import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ComponentDefinition } from './component-definitions';
import {
  COMPONENT_DEFINITIONS,
  getLayoutComponents,
  getFormComponents,
} from './component-definitions';

@Component({
  selector: 'form-editor-palette',
  imports: [CommonModule, TranslocoModule],
  template: `
    <div id="form-editor-palette" class="h-full flex flex-col bg-surface-50 dark:bg-surface-900">
      <div class="p-4 border-b border-surface-200 dark:border-surface-700">
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0 m-0">
          {{ 'formEditor.panels.components' | transloco }}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Layout Components -->
        <div>
          <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {{ 'formEditor.categories.layout' | transloco }}
          </h3>
          <div class="space-y-2">
            @for (component of layoutComponents; track component.type) {
              <button
                [id]="'form-editor-palette-' + component.type"
                type="button"
                class="w-full flex items-center gap-3 p-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors cursor-move"
                [attr.draggable]="true"
                (dragstart)="onDragStart($event, component)"
                (click)="onComponentClick(component)"
                [attr.aria-label]="
                  (component.labelKey | transloco) +
                  ' - ' +
                  ('formEditor.actions.dragComponent' | transloco)
                "
              >
                <i [class]="component.icon + ' text-xl text-primary'" aria-hidden="true"></i>
                <span class="text-sm text-surface-900 dark:text-surface-0">
                  {{ component.labelKey | transloco }}
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Form Components -->
        <div>
          <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {{ 'formEditor.categories.form' | transloco }}
          </h3>
          <div class="space-y-2">
            @for (component of formComponents; track component.type) {
              <button
                [id]="'form-editor-palette-' + component.type"
                type="button"
                class="w-full flex items-center gap-3 p-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors cursor-move"
                [attr.draggable]="true"
                (dragstart)="onDragStart($event, component)"
                (click)="onComponentClick(component)"
                [attr.aria-label]="
                  (component.labelKey | transloco) +
                  ' - ' +
                  ('formEditor.actions.dragComponent' | transloco)
                "
              >
                <i [class]="component.icon + ' text-xl text-primary'" aria-hidden="true"></i>
                <span class="text-sm text-surface-900 dark:text-surface-0">
                  {{ component.labelKey | transloco }}
                </span>
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorPalette {
  componentSelected = output<ComponentDefinition>();
  componentDragStart = output<{ event: DragEvent; component: ComponentDefinition }>();

  layoutComponents = getLayoutComponents();
  formComponents = getFormComponents();

  onComponentClick(component: ComponentDefinition): void {
    this.componentSelected.emit(component);
  }

  onDragStart(event: DragEvent, component: ComponentDefinition): void {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/json', JSON.stringify(component));
    }
    this.componentDragStart.emit({ event, component });
  }
}
