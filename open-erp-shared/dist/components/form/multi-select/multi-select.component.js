var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
let MultiSelectComponent = class MultiSelectComponent {
    elementRef;
    label = input(undefined);
    placeholder = input('Chọn nhiều mục...');
    options = input([]);
    maxDisplayTags = input(3);
    searchable = input(true);
    size = input(InputSize.MD);
    status = input(ValidationStatus.NONE);
    helperText = input(undefined);
    errorMessage = input(undefined);
    disabled = input(false);
    required = input(false);
    loading = input(false);
    valueChange = output();
    selectedValues = signal([]);
    isOpen = signal(false);
    searchTerm = signal('');
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    onClickOutside(event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen.set(false);
        }
    }
    filteredOptions = computed(() => {
        const q = this.searchTerm().toLowerCase().trim();
        const opts = this.options();
        if (!q)
            return opts;
        return opts.filter(opt => opt.label.toLowerCase().includes(q));
    });
    selectedOptions = computed(() => {
        const vals = this.selectedValues();
        return this.options().filter(opt => vals.includes(opt.value));
    });
    isAllSelected = computed(() => {
        const opts = this.options();
        return opts.length > 0 && this.selectedValues().length === opts.length;
    });
    writeValue(val) {
        this.selectedValues.set(Array.isArray(val) ? val : []);
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
    toggleDropdown() {
        if (this.effectiveDisabled())
            return;
        this.isOpen.update(prev => !prev);
        if (!this.isOpen()) {
            this.onTouched();
        }
    }
    isSelected(val) {
        return this.selectedValues().includes(val);
    }
    toggleOption(opt, event) {
        event.stopPropagation();
        if (opt.disabled)
            return;
        const current = [...this.selectedValues()];
        const idx = current.indexOf(opt.value);
        if (idx > -1) {
            current.splice(idx, 1);
        }
        else {
            current.push(opt.value);
        }
        this.selectedValues.set(current);
        this.onChange(current);
        this.valueChange.emit(current);
    }
    removeTag(val, event) {
        event.stopPropagation();
        if (this.effectiveDisabled())
            return;
        const current = this.selectedValues().filter(v => v !== val);
        this.selectedValues.set(current);
        this.onChange(current);
        this.valueChange.emit(current);
    }
    toggleSelectAll() {
        if (this.isAllSelected()) {
            this.selectedValues.set([]);
            this.onChange([]);
            this.valueChange.emit([]);
        }
        else {
            const allVals = this.options().filter(opt => !opt.disabled).map(opt => opt.value);
            this.selectedValues.set(allVals);
            this.onChange(allVals);
            this.valueChange.emit(allVals);
        }
    }
};
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], MultiSelectComponent.prototype, "onClickOutside", null);
MultiSelectComponent = __decorate([
    Component({
        selector: 'erp-multi-select',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => MultiSelectComponent),
                multi: true
            }
        ],
        templateUrl: './multi-select.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    }),
    __metadata("design:paramtypes", [ElementRef])
], MultiSelectComponent);
export { MultiSelectComponent };
//# sourceMappingURL=multi-select.component.js.map