var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, model, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
const SIZE_CLASSES = {
    sm: 'px-2.5 py-1 text-xs gap-1 rounded-lg',
    lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl font-bold',
    md: 'px-3.5 py-1.5 text-xs gap-1.5 rounded-xl font-semibold'
};
const CONTAINER_SIZE_CLASSES = {
    sm: 'p-0.5 rounded-xl',
    lg: 'p-1.5 rounded-2xl',
    md: 'p-1 rounded-2xl'
};
let SegmentedControlComponent = class SegmentedControlComponent {
    options = input([]);
    value = model(null);
    size = input('md');
    fullWidth = input(false);
    disabled = input(false);
    loading = input(false);
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    normalizedOptions = computed(() => {
        return this.options().map(opt => {
            if (typeof opt === 'string') {
                return { label: opt, value: opt };
            }
            return opt;
        });
    });
    sizeClass = computed(() => {
        return SIZE_CLASSES[this.size()] || SIZE_CLASSES['md'];
    });
    containerSizeClass = computed(() => {
        return CONTAINER_SIZE_CLASSES[this.size()] || CONTAINER_SIZE_CLASSES['md'];
    });
    iconSize = computed(() => (this.size() === 'lg' ? 18 : 14));
    writeValue(val) {
        this.value.set(val);
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
    selectOption(opt) {
        if (this.effectiveDisabled() || opt.disabled || this.value() === opt.value)
            return;
        this.value.set(opt.value);
        this.onChange(opt.value);
        this.onTouched();
    }
    onKeyDown(event, currentIndex) {
        if (this.effectiveDisabled())
            return;
        const opts = this.normalizedOptions();
        if (opts.length === 0)
            return;
        let nextIndex = currentIndex;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            nextIndex = (currentIndex + 1) % opts.length;
            while (opts[nextIndex].disabled && nextIndex !== currentIndex) {
                nextIndex = (nextIndex + 1) % opts.length;
            }
        }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            nextIndex = (currentIndex - 1 + opts.length) % opts.length;
            while (opts[nextIndex].disabled && nextIndex !== currentIndex) {
                nextIndex = (nextIndex - 1 + opts.length) % opts.length;
            }
        }
        if (nextIndex !== currentIndex && !opts[nextIndex].disabled) {
            this.selectOption(opts[nextIndex]);
        }
    }
};
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
        changeDetection: ChangeDetectionStrategy.OnPush,
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