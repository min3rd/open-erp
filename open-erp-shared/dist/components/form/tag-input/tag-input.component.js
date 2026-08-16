var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { ValidationStatus } from '../../../enums/component.enum';
let TagInputComponent = class TagInputComponent {
    label;
    placeholder = 'Nhập thẻ và ấn Enter...';
    maxTags;
    allowDuplicates = false;
    status = ValidationStatus.NONE;
    helperText;
    errorMessage;
    disabled = false;
    required = false;
    loading = false;
    tagsChange = new EventEmitter();
    tags = signal([]);
    inputValue = signal('');
    onChange = () => { };
    onTouched = () => { };
    writeValue(val) {
        this.tags.set(Array.isArray(val) ? val : []);
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
    onKeyDown(event) {
        if (this.disabled)
            return;
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            this.addTag();
        }
        else if (event.key === 'Backspace' && !this.inputValue() && this.tags().length > 0) {
            this.removeTag(this.tags().length - 1);
        }
    }
    addTag() {
        const raw = this.inputValue().trim().replace(/,/g, '');
        if (!raw)
            return;
        if (this.maxTags && this.tags().length >= this.maxTags)
            return;
        if (!this.allowDuplicates && this.tags().includes(raw)) {
            this.inputValue.set('');
            return;
        }
        const next = [...this.tags(), raw];
        this.tags.set(next);
        this.inputValue.set('');
        this.onChange(next);
        this.tagsChange.emit(next);
    }
    removeTag(index) {
        if (this.disabled)
            return;
        const next = this.tags().filter((_, i) => i !== index);
        this.tags.set(next);
        this.onChange(next);
        this.tagsChange.emit(next);
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], TagInputComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TagInputComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], TagInputComponent.prototype, "maxTags", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TagInputComponent.prototype, "allowDuplicates", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TagInputComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TagInputComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TagInputComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TagInputComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TagInputComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TagInputComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TagInputComponent.prototype, "tagsChange", void 0);
TagInputComponent = __decorate([
    Component({
        selector: 'erp-tag-input',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => TagInputComponent),
                multi: true
            }
        ],
        templateUrl: './tag-input.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], TagInputComponent);
export { TagInputComponent };
//# sourceMappingURL=tag-input.component.js.map