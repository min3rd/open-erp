var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
let SegmentedControlComponent = class SegmentedControlComponent {
    options = [];
    value;
    size = 'md';
    fullWidth = false;
    disabled = false;
    loading = false;
    valueChange = new EventEmitter();
    onChange = () => { };
    onTouched = () => { };
    get normalizedOptions() {
        return this.options.map(opt => {
            if (typeof opt === 'string') {
                return { label: opt, value: opt };
            }
            return opt;
        });
    }
    writeValue(val) {
        this.value = val;
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
    selectOption(opt) {
        if (this.disabled || opt.disabled || this.value === opt.value)
            return;
        this.value = opt.value;
        this.onChange(opt.value);
        this.onTouched();
        this.valueChange.emit(opt.value);
    }
    getSizeClasses() {
        switch (this.size) {
            case 'sm':
                return 'px-2.5 py-1 text-xs gap-1 rounded-lg';
            case 'lg':
                return 'px-5 py-2.5 text-sm gap-2 rounded-xl font-bold';
            case 'md':
            default:
                return 'px-3.5 py-1.5 text-xs gap-1.5 rounded-xl font-semibold';
        }
    }
    getContainerSizeClasses() {
        switch (this.size) {
            case 'sm':
                return 'p-0.5 rounded-xl';
            case 'lg':
                return 'p-1.5 rounded-2xl';
            case 'md':
            default:
                return 'p-1 rounded-2xl';
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], SegmentedControlComponent.prototype, "options", void 0);
__decorate([
    Input(),
    __metadata("design:type", Object)
], SegmentedControlComponent.prototype, "value", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], SegmentedControlComponent.prototype, "size", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SegmentedControlComponent.prototype, "fullWidth", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SegmentedControlComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], SegmentedControlComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], SegmentedControlComponent.prototype, "valueChange", void 0);
SegmentedControlComponent = __decorate([
    Component({
        selector: 'erp-segmented-control',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => SegmentedControlComponent),
                multi: true
            }
        ],
        templateUrl: './segmented-control.component.html',
        styles: [`
    :host {
      display: inline-block;
    }
    :host([block]) {
      display: block;
      width: 100%;
    }
  `]
    })
], SegmentedControlComponent);
export { SegmentedControlComponent };
//# sourceMappingURL=segmented-control.component.js.map