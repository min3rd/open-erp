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
import { ValidationStatus } from '../../../enums/component.enum';
let AutocompleteComponent = class AutocompleteComponent {
    elementRef;
    label;
    placeholder = 'Tìm kiếm và chọn...';
    items = [];
    minLength = 1;
    status = ValidationStatus.NONE;
    helperText;
    errorMessage;
    disabled = false;
    required = false;
    loading = false;
    itemSelect = new EventEmitter();
    query = signal('');
    isOpen = signal(false);
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
    normalizedItems = computed(() => {
        return this.items.map(item => typeof item === 'string' ? { label: item, value: item } : item);
    });
    filteredItems = computed(() => {
        const q = this.query().toLowerCase().trim();
        if (!q || q.length < this.minLength)
            return [];
        return this.normalizedItems().filter(it => it.label.toLowerCase().includes(q));
    });
    writeValue(val) {
        this.query.set(val !== undefined && val !== null ? String(val) : '');
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
        this.query.set(val);
        this.isOpen.set(val.length >= this.minLength);
        this.onChange(val);
    }
    selectItem(it) {
        this.query.set(it.label);
        this.isOpen.set(false);
        this.onChange(it.value);
        this.itemSelect.emit(it.value);
    }
    clear() {
        this.query.set('');
        this.isOpen.set(false);
        this.onChange('');
        this.itemSelect.emit('');
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], AutocompleteComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AutocompleteComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], AutocompleteComponent.prototype, "items", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], AutocompleteComponent.prototype, "minLength", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AutocompleteComponent.prototype, "status", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AutocompleteComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], AutocompleteComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AutocompleteComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AutocompleteComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], AutocompleteComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], AutocompleteComponent.prototype, "itemSelect", void 0);
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], AutocompleteComponent.prototype, "onClickOutside", null);
AutocompleteComponent = __decorate([
    Component({
        selector: 'erp-autocomplete',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => AutocompleteComponent),
                multi: true
            }
        ],
        templateUrl: './autocomplete.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    }),
    __metadata("design:paramtypes", [ElementRef])
], AutocompleteComponent);
export { AutocompleteComponent };
//# sourceMappingURL=autocomplete.component.js.map