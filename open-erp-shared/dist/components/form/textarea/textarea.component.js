var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { ValidationStatus } from '../../../enums/component.enum';
let TextareaComponent = class TextareaComponent {
    label;
    placeholder = '';
    rows = 3;
    maxLength;
    showCount = false;
    status = ValidationStatus.NONE;
    helperText;
    errorMessage;
    disabled = false;
    readonly = false;
    required = false;
    loading = false;
    valueChange = new EventEmitter();
    value = signal('');
    onChange = () => { };
    onTouched = () => { };
    currentLength = computed(() => this.value().length);
    writeValue(val) {
        this.value.set(val !== undefined && val !== null ? String(val) : '');
    }
    registerOnChange(fn) {
        this.onChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
    onInput(event) {
        const val = event.target.value;
        this.value.set(val);
        this.onChange(val);
        this.valueChange.emit(val);
    }
    getStatusClasses() {
        const st = String(this.status);
        if (this.errorMessage || st === ValidationStatus.INVALID || st === 'invalid') {
            return 'border-rose-500 focus:ring-rose-500/30 text-rose-900 dark:text-rose-100';
        }
        if (st === ValidationStatus.VALID || st === 'valid') {
            return 'border-emerald-500 focus:ring-emerald-500/30 text-emerald-900 dark:text-emerald-100';
        }
        if (st === ValidationStatus.WARNING || st === 'warning') {
            return 'border-amber-500 focus:ring-amber-500/30 text-amber-900 dark:text-amber-100';
        }
        return 'border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-900 dark:text-white';
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], TextareaComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TextareaComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], TextareaComponent.prototype, "rows", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], TextareaComponent.prototype, "maxLength", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TextareaComponent.prototype, "showCount", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TextareaComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TextareaComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TextareaComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TextareaComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TextareaComponent.prototype, "readonly", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TextareaComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TextareaComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TextareaComponent.prototype, "valueChange", void 0);
TextareaComponent = __decorate([
    Component({
        selector: 'erp-textarea',
        standalone: true,
        imports: [CommonModule, FormsModule, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => TextareaComponent),
                multi: true
            }
        ],
        templateUrl: './textarea.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], TextareaComponent);
export { TextareaComponent };
//# sourceMappingURL=textarea.component.js.map