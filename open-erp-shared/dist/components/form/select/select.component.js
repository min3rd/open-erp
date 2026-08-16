var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';
let SelectComponent = class SelectComponent {
    elementRef;
    label;
    placeholder = 'Chọn một mục...';
    options = [];
    searchable = false;
    clearable = false;
    size = InputSize.MD;
    status = ValidationStatus.NONE;
    helperText;
    errorMessage;
    disabled = false;
    required = false;
    loading = false;
    valueChange = new EventEmitter();
    selectedValue = signal(null);
    isOpen = signal(false);
    searchTerm = signal('');
    onChange = () => { };
    onTouched = () => { };
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    onClickOutside(event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen.set(false);
        }
    }
    filteredOptions = computed(() => {
        const q = this.searchTerm().toLowerCase().trim();
        if (!q)
            return this.options;
        return this.options.filter(opt => opt.label.toLowerCase().includes(q) ||
            (opt.description && opt.description.toLowerCase().includes(q)));
    });
    selectedOption = computed(() => {
        const v = this.selectedValue();
        return this.options.find(opt => opt.value === v);
    });
    writeValue(val) {
        this.selectedValue.set(val);
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
    toggleDropdown() {
        if (this.disabled)
            return;
        this.isOpen.update(prev => !prev);
        if (this.isOpen()) {
            this.searchTerm.set('');
        }
        else {
            this.onTouched();
        }
    }
    selectOption(opt) {
        if (opt.disabled)
            return;
        this.selectedValue.set(opt.value);
        this.onChange(opt.value);
        this.valueChange.emit(opt.value);
        this.isOpen.set(false);
    }
    clearSelection(event) {
        event.stopPropagation();
        this.selectedValue.set(null);
        this.onChange(null);
        this.valueChange.emit(null);
    }
    getSizeClasses() {
        const s = String(this.size);
        switch (s) {
            case InputSize.SM:
            case 'sm':
                return 'py-1.5 px-3 text-xs rounded-xl';
            case InputSize.LG:
            case 'lg':
                return 'py-3 px-4 text-sm rounded-2xl';
            case InputSize.MD:
            case 'md':
            default:
                return 'py-2.5 px-3.5 text-xs rounded-xl';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], SelectComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SelectComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], SelectComponent.prototype, "options", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SelectComponent.prototype, "searchable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SelectComponent.prototype, "clearable", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SelectComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SelectComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SelectComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SelectComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SelectComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SelectComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SelectComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SelectComponent.prototype, "valueChange", void 0);
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], SelectComponent.prototype, "onClickOutside", null);
SelectComponent = __decorate([
    Component({
        selector: 'erp-select',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => SelectComponent),
                multi: true
            }
        ],
        templateUrl: './select.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    }),
    __metadata("design:paramtypes", [ElementRef])
], SelectComponent);
export { SelectComponent };
//# sourceMappingURL=select.component.js.map