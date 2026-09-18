import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pin-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pin-input.component.html'
})
export class PinInputComponent {
  length = input<number>(6);
  disabled = input<boolean>(false);
  hasError = input<boolean>(false);

  completed = output<string>();
  changed = output<string>();

  digits = signal<string[]>(['', '', '', '', '', '']);

  handleInput(event: any, index: number) {
    const val = event.target.value.replace(/[^0-9]/g, '');
    const current = [...this.digits()];
    current[index] = val ? val.slice(-1) : '';
    this.digits.set(current);

    const fullCode = current.join('');
    this.changed.emit(fullCode);

    if (val && index < this.length() - 1) {
      const inputs = (event.target.parentElement as HTMLElement).querySelectorAll('input');
      inputs[index + 1]?.focus();
    }

    if (fullCode.length === this.length() && !current.includes('')) {
      this.completed.emit(fullCode);
    }
  }

  handleKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      const inputs = ((event.target as HTMLElement).parentElement as HTMLElement).querySelectorAll('input');
      inputs[index - 1]?.focus();
    }
  }

  handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const clean = pasted.replace(/[^0-9]/g, '').slice(0, this.length());
    if (!clean) return;

    const current = [...this.digits()];
    for (let i = 0; i < clean.length; i++) {
      current[i] = clean[i];
    }
    this.digits.set(current);

    const fullCode = current.join('');
    this.changed.emit(fullCode);

    if (fullCode.length === this.length() && !current.includes('')) {
      this.completed.emit(fullCode);
    }
  }

  reset() {
    this.digits.set(new Array(this.length()).fill(''));
  }
}
