import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { SelectOption } from '../select/select.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';

@Component({
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
})
export class MultiSelectComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string>('Chọn nhiều mục...');
  readonly options = input<SelectOption[]>([]);
  readonly maxDisplayTags = input<number>(3);
  readonly searchable = input<boolean>(true);
  readonly size = input<InputSize | 'sm' | 'md' | 'lg'>(InputSize.MD);
  readonly status = input<ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'>(ValidationStatus.NONE);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly valueChange = output<any[]>();

  selectedValues = signal<any[]>([]);
  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  isDisabled = signal<boolean>(false);

  onChange: (val: any[]) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  readonly filteredOptions = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    const opts = this.options();
    if (!q) return opts;
    return opts.filter(opt => opt.label.toLowerCase().includes(q));
  });

  readonly selectedOptions = computed(() => {
    const vals = this.selectedValues();
    return this.options().filter(opt => vals.includes(opt.value));
  });

  readonly isAllSelected = computed(() => {
    const opts = this.options();
    return opts.length > 0 && this.selectedValues().length === opts.length;
  });

  writeValue(val: any): void {
    this.selectedValues.set(Array.isArray(val) ? val : []);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  toggleDropdown(): void {
    if (this.effectiveDisabled()) return;
    this.isOpen.update(prev => !prev);
    if (!this.isOpen()) {
      this.onTouched();
    }
  }

  isSelected(val: any): boolean {
    return this.selectedValues().includes(val);
  }

  toggleOption(opt: SelectOption, event: MouseEvent): void {
    event.stopPropagation();
    if (opt.disabled) return;

    const current = [...this.selectedValues()];
    const idx = current.indexOf(opt.value);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(opt.value);
    }

    this.selectedValues.set(current);
    this.onChange(current);
    this.valueChange.emit(current);
  }

  removeTag(val: any, event: MouseEvent): void {
    event.stopPropagation();
    if (this.effectiveDisabled()) return;
    const current = this.selectedValues().filter(v => v !== val);
    this.selectedValues.set(current);
    this.onChange(current);
    this.valueChange.emit(current);
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedValues.set([]);
      this.onChange([]);
      this.valueChange.emit([]);
    } else {
      const allVals = this.options().filter(opt => !opt.disabled).map(opt => opt.value);
      this.selectedValues.set(allVals);
      this.onChange(allVals);
      this.valueChange.emit(allVals);
    }
  }
}
