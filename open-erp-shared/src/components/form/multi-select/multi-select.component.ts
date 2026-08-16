import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, HostListener, ElementRef } from '@angular/core';
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
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class MultiSelectComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder: string = 'Chọn nhiều mục...';
  @Input() options: SelectOption[] = [];
  @Input() maxDisplayTags: number = 3;
  @Input() searchable: boolean = true;
  @Input() size: InputSize | 'sm' | 'md' | 'lg' = InputSize.MD;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() valueChange = new EventEmitter<any[]>();

  selectedValues = signal<any[]>([]);
  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');

  onChange: (val: any[]) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  readonly filteredOptions = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    if (!q) return this.options;
    return this.options.filter(opt => opt.label.toLowerCase().includes(q));
  });

  readonly selectedOptions = computed(() => {
    const vals = this.selectedValues();
    return this.options.filter(opt => vals.includes(opt.value));
  });

  readonly isAllSelected = computed(() => {
    return this.options.length > 0 && this.selectedValues().length === this.options.length;
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
    this.disabled = isDisabled;
  }

  toggleDropdown(): void {
    if (this.disabled) return;
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
    if (this.disabled) return;
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
      const allVals = this.options.filter(opt => !opt.disabled).map(opt => opt.value);
      this.selectedValues.set(allVals);
      this.onChange(allVals);
      this.valueChange.emit(allVals);
    }
  }
}
