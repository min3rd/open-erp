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
let DateRangePickerComponent = class DateRangePickerComponent {
    label = input(undefined);
    status = input(ValidationStatus.NONE);
    helperText = input(undefined);
    errorMessage = input(undefined);
    disabled = input(false);
    required = input(false);
    loading = input(false);
    rangeChange = output();
    startDate = signal('');
    endDate = signal('');
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    writeValue(val) {
        if (val && typeof val === 'object') {
            this.startDate.set(val.startDate || '');
            this.endDate.set(val.endDate || '');
        }
        else {
            this.startDate.set('');
            this.endDate.set('');
        }
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
    onStartChange(event) {
        const val = event.target.value;
        this.startDate.set(val);
        this.emitRange();
    }
    onEndChange(event) {
        const val = event.target.value;
        this.endDate.set(val);
        this.emitRange();
    }
    emitRange() {
        const range = { startDate: this.startDate(), endDate: this.endDate() };
        this.onChange(range);
        this.rangeChange.emit(range);
    }
    setShortcut(type) {
        if (this.effectiveDisabled())
            return;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        if (type === 'today') {
            this.startDate.set(todayStr);
            this.endDate.set(todayStr);
        }
        else if (type === 'week') {
            const first = new Date(now.setDate(now.getDate() - now.getDay() + 1));
            const last = new Date(now.setDate(now.getDate() - now.getDay() + 7));
            this.startDate.set(first.toISOString().split('T')[0]);
            this.endDate.set(last.toISOString().split('T')[0]);
        }
        else if (type === 'month') {
            const first = new Date(now.getFullYear(), now.getMonth(), 1);
            const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            this.startDate.set(first.toISOString().split('T')[0]);
            this.endDate.set(last.toISOString().split('T')[0]);
        }
        else if (type === 'quarter') {
            const qMonth = Math.floor(now.getMonth() / 3) * 3;
            const first = new Date(now.getFullYear(), qMonth, 1);
            const last = new Date(now.getFullYear(), qMonth + 3, 0);
            this.startDate.set(first.toISOString().split('T')[0]);
            this.endDate.set(last.toISOString().split('T')[0]);
        }
        this.emitRange();
    }
};
DateRangePickerComponent = __decorate([
    Component({
        selector: 'erp-date-range-picker',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => DateRangePickerComponent),
                multi: true
            }
        ],
        templateUrl: './date-range-picker.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], DateRangePickerComponent);
export { DateRangePickerComponent };
//# sourceMappingURL=date-range-picker.component.js.map