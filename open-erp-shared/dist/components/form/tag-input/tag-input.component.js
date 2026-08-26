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
import { ValidationStatus } from '../../../enums/component.enum';
let TagInputComponent = class TagInputComponent {
    label = input(undefined);
    placeholder = input('Nhập thẻ và ấn Enter...');
    maxTags = input(undefined);
    allowDuplicates = input(false);
    status = input(ValidationStatus.NONE);
    helperText = input(undefined);
    errorMessage = input(undefined);
    disabled = input(false);
    required = input(false);
    loading = input(false);
    tagsChange = output();
    tags = signal([]);
    inputValue = signal('');
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
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
        this.isDisabled.set(isDisabled);
    }
    onKeyDown(event) {
        if (this.effectiveDisabled())
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
        const maxT = this.maxTags();
        if (maxT && this.tags().length >= maxT)
            return;
        if (!this.allowDuplicates() && this.tags().includes(raw)) {
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
        if (this.effectiveDisabled())
            return;
        const next = this.tags().filter((_, i) => i !== index);
        this.tags.set(next);
        this.onChange(next);
        this.tagsChange.emit(next);
    }
};
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
        changeDetection: ChangeDetectionStrategy.OnPush,
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