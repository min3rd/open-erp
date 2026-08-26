import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed, ElementRef, ViewChildren, QueryList, OnInit } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class OtpInputComponent implements ControlValueAccessor, OnInit {
  readonly label = input<string | undefined>('Mã xác thực OTP');
  readonly length = input<number>(6);
  readonly status = input<ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'>(ValidationStatus.NONE);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly completed = output<string>();
  readonly valueChange = output<string>();

  @ViewChildren('otpInput') inputElements!: QueryList<ElementRef<HTMLInputElement>>;

  digits = signal<string[]>([]);
  isDisabled = signal<boolean>(false);

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  readonly slots = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  ngOnInit(): void {
    this.digits.set(new Array(this.length()).fill(''));
  }

  writeValue(val: any): void {
    const len = this.length();
    const str = String(val || '');
    const arr = new Array(len).fill('');
    for (let i = 0; i < len && i < str.length; i++) {
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
    this.isDisabled.set(isDisabled);
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.slice(-1);
    const len = this.length();
    
    const arr = [...this.digits()];
    arr[index] = val;
    this.digits.set(arr);

    const fullCode = arr.join('');
    this.onChange(fullCode);
    this.valueChange.emit(fullCode);

    if (val && index < len - 1) {
      const el = this.inputElements.get(index + 1);
      el?.nativeElement.focus();
    }

    if (fullCode.length === len && !arr.includes('')) {
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
    const len = this.length();
    const clipboardData = event.clipboardData?.getData('text') || '';
    const clean = clipboardData.replace(/\D/g, '').slice(0, len);
    if (!clean) return;

    const arr = new Array(len).fill('');
    for (let i = 0; i < clean.length; i++) {
      arr[i] = clean[i];
    }
    this.digits.set(arr);

    const fullCode = arr.join('');
    this.onChange(fullCode);
    this.valueChange.emit(fullCode);

    if (clean.length === len) {
      this.completed.emit(fullCode);
    }
  }
}
