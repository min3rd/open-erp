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
const SIZE_CLASSES = {
    [InputSize.SM]: 'py-1.5 px-3 text-xs rounded-xl',
    [InputSize.LG]: 'py-3 px-4 text-sm rounded-2xl',
    [InputSize.MD]: 'py-2.5 px-3.5 text-xs rounded-xl'
};
let SelectComponent = class SelectComponent {
    elementRef;
    label = input(undefined);
    placeholder = input('Chọn một mục...');
    options = input([]);
    searchable = input(false);
    clearable = input(false);
    size = input(InputSize.MD);
    status = input(ValidationStatus.NONE);
    helperText = input(undefined);
    errorMessage = input(undefined);
    disabled = input(false);
    required = input(false);
    loading = input(false);
    valueChange = output();
    selectedValue = signal(null);
    isOpen = signal(false);
    searchTerm = signal('');
    activeIndex = signal(-1);
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    sizeClass = computed(() => {
        const s = String(this.size());
        return SIZE_CLASSES[s] || SIZE_CLASSES[InputSize.MD];
    });
    skeletonHeight = computed(() => {
        const s = String(this.size());
        return s === 'lg' ? '2.875rem' : (s === 'sm' ? '2rem' : '2.5rem');
    });
    onClickOutside(event) {
        if (!this.isOpen())
            return;
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen.set(false);
            this.activeIndex.set(-1);
            this.onTouched();
        }
    }
    onKeyDown(event) {
        if (this.effectiveDisabled())
            return;
        const opts = this.filteredOptions();
        const open = this.isOpen();
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!open) {
                    this.openDropdown();
                }
                else if (opts.length > 0) {
                    let next = this.activeIndex() + 1;
                    while (next < opts.length && opts[next].disabled) {
                        next++;
                    }
                    if (next < opts.length) {
                        this.activeIndex.set(next);
                        this.scrollActiveIntoView(next);
                    }
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (open && opts.length > 0) {
                    let prev = this.activeIndex() - 1;
                    while (prev >= 0 && opts[prev].disabled) {
                        prev--;
                    }
                    if (prev >= 0) {
                        this.activeIndex.set(prev);
                        this.scrollActiveIntoView(prev);
                    }
                }
                break;
            case 'Enter':
                if (open && this.activeIndex() >= 0 && this.activeIndex() < opts.length) {
                    event.preventDefault();
                    const targetOpt = opts[this.activeIndex()];
                    if (!targetOpt.disabled) {
                        this.selectOption(targetOpt);
                    }
                }
                else if (!open) {
                    event.preventDefault();
                    this.openDropdown();
                }
                break;
            case 'Escape':
                if (open) {
                    event.preventDefault();
                    this.isOpen.set(false);
                    this.activeIndex.set(-1);
                    this.onTouched();
                }
                break;
            case 'Tab':
                if (open) {
                    this.isOpen.set(false);
                    this.activeIndex.set(-1);
                    this.onTouched();
                }
                break;
        }
    }
    scrollActiveIntoView(index) {
        setTimeout(() => {
            const items = this.elementRef.nativeElement.querySelectorAll('.erp-select-option');
            if (items && items[index]) {
                items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        });
    }
    filteredOptions = computed(() => {
        const list = this.options();
        const q = this.searchTerm().toLowerCase().trim();
        if (!q)
            return list;
        return list.filter(opt => opt.label.toLowerCase().includes(q) ||
            (opt.description && opt.description.toLowerCase().includes(q)));
    });
    selectedOption = computed(() => {
        const v = this.selectedValue();
        return this.options().find(opt => opt.value === v);
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
        this.isDisabled.set(isDisabled);
    }
    openDropdown() {
        if (this.effectiveDisabled())
            return;
        this.isOpen.set(true);
        this.searchTerm.set('');
        const curVal = this.selectedValue();
        const idx = this.filteredOptions().findIndex(o => o.value === curVal);
        this.activeIndex.set(idx >= 0 ? idx : 0);
    }
    toggleDropdown() {
        if (this.effectiveDisabled())
            return;
        if (this.isOpen()) {
            this.isOpen.set(false);
            this.activeIndex.set(-1);
            this.onTouched();
        }
        else {
            this.openDropdown();
        }
    }
    selectOption(opt) {
        if (opt.disabled)
            return;
        this.selectedValue.set(opt.value);
        this.onChange(opt.value);
        this.valueChange.emit(opt.value);
        this.isOpen.set(false);
        this.activeIndex.set(-1);
    }
    clearSelection(event) {
        event.stopPropagation();
        this.selectedValue.set(null);
        this.onChange(null);
        this.valueChange.emit(null);
    }
};
__decorate([
    HostListener('document:click', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MouseEvent]),
    __metadata("design:returntype", void 0)
], SelectComponent.prototype, "onClickOutside", null);
__decorate([
    HostListener('keydown', ['$event']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [KeyboardEvent]),
    __metadata("design:returntype", void 0)
], SelectComponent.prototype, "onKeyDown", null);
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
        changeDetection: ChangeDetectionStrategy.OnPush,
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