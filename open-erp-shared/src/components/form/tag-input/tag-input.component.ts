import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { ValidationStatus } from '../../../enums/component.enum';

@Component({
  selector: 'erp-tag-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true
    }
  ],
  templateUrl: './tag-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TagInputComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string>('Nhập thẻ và ấn Enter...');
  readonly maxTags = input<number | undefined>(undefined);
  readonly allowDuplicates = input<boolean>(false);
  readonly status = input<ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'>(ValidationStatus.NONE);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly tagsChange = output<string[]>();

  tags = signal<string[]>([]);
  inputValue = signal<string>('');
  isDisabled = signal<boolean>(false);

  onChange: (val: string[]) => void = () => {};
  onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  writeValue(val: any): void {
    this.tags.set(Array.isArray(val) ? val : []);
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

  onKeyDown(event: KeyboardEvent): void {
    if (this.effectiveDisabled()) return;
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    } else if (event.key === 'Backspace' && !this.inputValue() && this.tags().length > 0) {
      this.removeTag(this.tags().length - 1);
    }
  }

  addTag(): void {
    const raw = this.inputValue().trim().replace(/,/g, '');
    if (!raw) return;
    const maxT = this.maxTags();
    if (maxT && this.tags().length >= maxT) return;
    if (!this.allowDuplicates() && this.tags().includes(raw)) {
      this.inputValue.set('');
      return;
    }

    const next = [...this.tags(), raw];
    this.tags.set(next);
    this.inputValue.set('');
    this.onChange(next);
    this.tagsChange.emit(next);
  }

  removeTag(index: number): void {
    if (this.effectiveDisabled()) return;
    const next = this.tags().filter((_, i) => i !== index);
    this.tags.set(next);
    this.onChange(next);
    this.tagsChange.emit(next);
  }
}
