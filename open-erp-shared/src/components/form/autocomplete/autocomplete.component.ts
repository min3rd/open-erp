import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { ValidationStatus } from '../../../enums/component.enum';

export interface AutocompleteItem {
  label: string;
  value: any;
  category?: string;
  icon?: IconName;
}

@Component({
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class AutocompleteComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string>('Tìm kiếm và chọn...');
  readonly items = input<(string | AutocompleteItem)[]>([]);
  readonly minLength = input<number>(1);
  readonly status = input<ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'>(ValidationStatus.NONE);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly itemSelect = output<any>();

  query = signal<string>('');
  isOpen = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  readonly normalizedItems = computed<AutocompleteItem[]>(() => {
    return this.items().map(item => typeof item === 'string' ? { label: item, value: item } : item);
  });

  readonly filteredItems = computed<AutocompleteItem[]>(() => {
    const q = this.query().toLowerCase().trim();
    const minL = this.minLength();
    if (!q || q.length < minL) return [];
    return this.normalizedItems().filter(it => it.label.toLowerCase().includes(q));
  });

  writeValue(val: any): void {
    this.query.set(val !== undefined && val !== null ? String(val) : '');
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

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.query.set(val);
    this.isOpen.set(val.length >= this.minLength());
    this.onChange(val);
  }

  selectItem(it: AutocompleteItem): void {
    this.query.set(it.label);
    this.isOpen.set(false);
    this.onChange(it.value);
    this.itemSelect.emit(it.value);
  }

  clear(): void {
    this.query.set('');
    this.isOpen.set(false);
    this.onChange('');
    this.itemSelect.emit('');
  }
}
