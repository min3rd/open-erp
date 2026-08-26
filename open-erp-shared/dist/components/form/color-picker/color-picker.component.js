var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
const DEFAULT_PRESETS = [
    '#4f46e5', '#3b82f6', '#06b6d4', '#10b981', '#84cc16',
    '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'
];
let ColorPickerComponent = class ColorPickerComponent {
    label = input(undefined);
    presets = input(DEFAULT_PRESETS);
    disabled = input(false);
    loading = input(false);
    helperText = input(undefined);
    valueChange = output();
    color = signal('#4f46e5');
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    writeValue(val) {
        this.color.set(val || '#4f46e5');
    }
    registerOnChange(fn) {
        this.onChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled) {
        this.isDisabled.set(isDisabled);
    }
    onColorChange(val) {
        if (this.effectiveDisabled())
            return;
        this.color.set(val);
        this.onChange(val);
        this.valueChange.emit(val);
    }
};
ColorPickerComponent = __decorate([
    Component({
        selector: 'erp-color-picker',
        standalone: true,
        imports: [CommonModule, FormsModule, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => ColorPickerComponent),
                multi: true
            }
        ],
        templateUrl: './color-picker.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], ColorPickerComponent);
export { ColorPickerComponent };
//# sourceMappingURL=color-picker.component.js.map