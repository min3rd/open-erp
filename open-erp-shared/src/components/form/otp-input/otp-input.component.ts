import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
import { ValidationStatus } from '../../../enums/component.enum';

@Component({
  selector: 'erp-otp-input',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OtpInputComponent),
      multi: true
    }
  ],
  templateUrl: './otp-input.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class OtpInputComponent implements ControlValueAccessor {
  @Input() label?: string = 'Mã xác thực OTP';
  @Input() length: number = 6;
  @Input() status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning' = ValidationStatus.NONE;
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() completed = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<string>();

  @ViewChildren('otpInput') inputElements!: QueryList<ElementRef<HTMLInputElement>>;

  digits = signal<string[]>([]);

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly slots = computed(() => Array.from({ length: this.length }, (_, i) => i));

  ngOnInit(): void {
    this.digits.set(new Array(this.length).fill(''));
  }

  writeValue(val: any): void {
    const str = String(val || '');
    const arr = new Array(this.length).fill('');
    for (let i = 0; i < this.length && i < str.length; i++) {
      arr[i] = str[i];
    }
    this.digits.set(arr);
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

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.slice(-1);
    
    const arr = [...this.digits()];
    arr[index] = val;
    this.digits.set(arr);

    const fullCode = arr.join('');
    this.onChange(fullCode);
    this.valueChange.emit(fullCode);

    if (val && index < this.length - 1) {
      const el = this.inputElements.get(index + 1);
      el?.nativeElement.focus();
    }

    if (fullCode.length === this.length && !arr.includes('')) {
      this.completed.emit(fullCode);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      const el = this.inputElements.get(index - 1);
      el?.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData?.getData('text') || '';
    const clean = clipboardData.replace(/\D/g, '').slice(0, this.length);
    if (!clean) return;

    const arr = new Array(this.length).fill('');
    for (let i = 0; i < clean.length; i++) {
      arr[i] = clean[i];
    }
    this.digits.set(arr);

    const fullCode = arr.join('');
    this.onChange(fullCode);
    this.valueChange.emit(fullCode);

    if (clean.length === this.length) {
      this.completed.emit(fullCode);
    }
  }
}
