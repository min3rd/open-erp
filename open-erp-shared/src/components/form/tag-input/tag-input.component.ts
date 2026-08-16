import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
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
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TagInputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder: string = 'Nhập thẻ và ấn Enter...';
  @Input() maxTags?: number;
  @Input() allowDuplicates: boolean = false;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() tagsChange = new EventEmitter<string[]>();

  tags = signal<string[]>([]);
  inputValue = signal<string>('');

  onChange: (val: string[]) => void = () => {};
  onTouched: () => void = () => {};

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
    this.disabled = isDisabled;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;
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
    if (this.maxTags && this.tags().length >= this.maxTags) return;
    if (!this.allowDuplicates && this.tags().includes(raw)) {
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
    if (this.disabled) return;
    const next = this.tags().filter((_, i) => i !== index);
    this.tags.set(next);
    this.onChange(next);
    this.tagsChange.emit(next);
  }
}
