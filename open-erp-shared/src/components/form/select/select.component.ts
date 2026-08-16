import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { InputSize, ValidationStatus } from '../../../enums/component.enum';

export interface SelectOption {
  label: string;
  value: any;
  icon?: IconName;
  description?: string;
  disabled?: boolean;
}

@Component({
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
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder: string = 'Chọn một mục...';
  @Input() options: SelectOption[] = [];
  @Input() searchable: boolean = false;
  @Input() clearable: boolean = false;
  @Input() size: InputSize | 'sm' | 'md' | 'lg' = InputSize.MD;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() valueChange = new EventEmitter<any>();

  selectedValue = signal<any>(null);
  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');

  onChange: (val: any) => void = () => {};
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
    return this.options.filter(opt => 
      opt.label.toLowerCase().includes(q) || 
      (opt.description && opt.description.toLowerCase().includes(q))
    );
  });

  readonly selectedOption = computed(() => {
    const v = this.selectedValue();
    return this.options.find(opt => opt.value === v);
  });

  writeValue(val: any): void {
    this.selectedValue.set(val);
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
    if (this.isOpen()) {
      this.searchTerm.set('');
    } else {
      this.onTouched();
    }
  }

  selectOption(opt: SelectOption): void {
    if (opt.disabled) return;
    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.isOpen.set(false);
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedValue.set(null);
    this.onChange(null);
    this.valueChange.emit(null);
  }

  getSizeClasses(): string {
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
}
