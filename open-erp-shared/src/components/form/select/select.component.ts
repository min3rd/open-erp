import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed, HostListener, ElementRef } from '@angular/core';
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

const SIZE_CLASSES: Record<string, string> = {
  [InputSize.SM]: 'py-1.5 px-3 text-xs rounded-xl',
  [InputSize.LG]: 'py-3 px-4 text-sm rounded-2xl',
  [InputSize.MD]: 'py-2.5 px-3.5 text-xs rounded-xl'
};

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class SelectComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string>('Chọn một mục...');
  readonly options = input<SelectOption[]>([]);
  readonly searchable = input<boolean>(false);
  readonly clearable = input<boolean>(false);
  readonly size = input<InputSize | 'sm' | 'md' | 'lg'>(InputSize.MD);
  readonly status = input<ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'>(ValidationStatus.NONE);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly valueChange = output<any>();

  selectedValue = signal<any>(null);
  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  activeIndex = signal<number>(-1);
  isDisabled = signal<boolean>(false);

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  readonly sizeClass = computed(() => {
    const s = String(this.size());
    return SIZE_CLASSES[s] || SIZE_CLASSES[InputSize.MD];
  });

  readonly skeletonHeight = computed(() => {
    const s = String(this.size());
    return s === 'lg' ? '2.875rem' : (s === 'sm' ? '2rem' : '2.5rem');
  });

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.activeIndex.set(-1);
      this.onTouched();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.effectiveDisabled()) return;

    const opts = this.filteredOptions();
    const open = this.isOpen();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          this.openDropdown();
        } else if (opts.length > 0) {
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
        } else if (!open) {
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

  private scrollActiveIntoView(index: number): void {
    setTimeout(() => {
      const items = this.elementRef.nativeElement.querySelectorAll('.erp-select-option');
      if (items && items[index]) {
        items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  readonly filteredOptions = computed(() => {
    const list = this.options();
    const q = this.searchTerm().toLowerCase().trim();
    if (!q) return list;
    return list.filter(opt => 
      opt.label.toLowerCase().includes(q) || 
      (opt.description && opt.description.toLowerCase().includes(q))
    );
  });

  readonly selectedOption = computed(() => {
    const v = this.selectedValue();
    return this.options().find(opt => opt.value === v);
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
    this.isDisabled.set(isDisabled);
  }

  openDropdown(): void {
    if (this.effectiveDisabled()) return;
    this.isOpen.set(true);
    this.searchTerm.set('');
    const curVal = this.selectedValue();
    const idx = this.filteredOptions().findIndex(o => o.value === curVal);
    this.activeIndex.set(idx >= 0 ? idx : 0);
  }

  toggleDropdown(): void {
    if (this.effectiveDisabled()) return;
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.activeIndex.set(-1);
      this.onTouched();
    } else {
      this.openDropdown();
    }
  }

  selectOption(opt: SelectOption): void {
    if (opt.disabled) return;
    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.isOpen.set(false);
    this.activeIndex.set(-1);
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedValue.set(null);
    this.onChange(null);
    this.valueChange.emit(null);
  }
}
