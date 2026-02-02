import { Component, input, output, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { FormComponent, FormFieldConfig } from './form-editor.types';

@Component({
  selector: 'form-editor-inspector',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    InputText,
    Checkbox,
    Button,
    InputNumber,
  ],
  templateUrl: './form-editor-inspector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorInspector {
  component = input<FormComponent | null>(null);
  componentChanged = output<FormComponent>();
  componentRemoved = output<string>();

  localComponent: any = {};

  constructor() {
    // Watch for component changes
    const comp = this.component();
    if (comp) {
      this.localComponent = { ...comp };
      // Initialize validation if it's a form field
      if (this.isFormField() && !this.localComponent.validation) {
        this.localComponent.validation = {};
      }
    }
  }

  ngOnChanges(): void {
    const comp = this.component();
    if (comp) {
      this.localComponent = { ...comp };
      // Initialize validation if it's a form field
      if (this.isFormField() && !this.localComponent.validation) {
        this.localComponent.validation = {};
      }
    }
  }

  hasPlaceholder(): boolean {
    const type = this.localComponent.type;
    return [
      'input',
      'textarea',
      'select',
      'date-picker',
      'autocomplete',
      'cascade-select',
    ].includes(type);
  }

  isFormField(): boolean {
    const type = this.localComponent.type;
    return ![
      'layout-1-column',
      'layout-2-column',
      'layout-3-column',
      'divider',
      'button',
    ].includes(type);
  }

  fieldValidation(): any {
    if (this.isFormField()) {
      if (!this.localComponent.validation) {
        this.localComponent.validation = {};
      }
      return this.localComponent.validation;
    }
    return null;
  }

  onPropertyChange(): void {
    this.componentChanged.emit({ ...this.localComponent });
  }

  onRemove(): void {
    if (this.localComponent.id) {
      this.componentRemoved.emit(this.localComponent.id);
    }
  }
}
