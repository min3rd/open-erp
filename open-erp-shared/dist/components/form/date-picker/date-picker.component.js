var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
const SIZE_CLASSES = {
    [InputSize.SM]: 'py-1.5 px-3 text-xs rounded-xl',
    [InputSize.LG]: 'py-3 px-4 text-sm rounded-2xl',
    [InputSize.MD]: 'py-2.5 px-3.5 text-xs rounded-xl'
};
let DatePickerComponent = class DatePickerComponent {
    label = input(undefined);
    placeholder = input('YYYY-MM-DD');
    min = input(undefined);
    max = input(undefined);
    size = input(InputSize.MD);
    status = input(ValidationStatus.NONE);
    helperText = input(undefined);
    errorMessage = input(undefined);
    disabled = input(false);
    required = input(false);
    loading = input(false);
    valueChange = output();
    value = signal('');
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    sizeClass = computed(() => {
        const s = String(this.size());
        return SIZE_CLASSES[s] || SIZE_CLASSES[InputSize.MD];
    });
    iconSize = computed(() => (this.size() === 'sm' ? 14 : 16));
    skeletonHeight = computed(() => {
        const s = String(this.size());
        return s === 'lg' ? '2.875rem' : (s === 'sm' ? '2rem' : '2.5rem');
    });
    writeValue(val) {
        this.value.set(val || '');
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
    onInputChange(event) {
        const val = event.target.value;
        this.value.set(val);
        this.onChange(val);
        this.valueChange.emit(val);
    }
    setToday() {
        if (this.effectiveDisabled())
            return;
        const today = new Date().toISOString().split('T')[0];
        this.value.set(today);
        this.onChange(today);
        this.valueChange.emit(today);
    }
};
DatePickerComponent = __decorate([
    Component({
        selector: 'erp-date-picker',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => DatePickerComponent),
                multi: true
            }
        ],
        templateUrl: './date-picker.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], DatePickerComponent);
export { DatePickerComponent };
//# sourceMappingURL=date-picker.component.js.map