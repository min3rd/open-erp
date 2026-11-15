import { Component, computed, input, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

/** Month input displayed as `mm/yyyy`; model stays `yyyy-MM`. */
@Component({
  selector: 'app-month-field',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './month-field.component.html',
  host: { class: 'block' },
})
export class MonthFieldComponent {
  value = model<string>('');
  placeholder = input<string>('mm/yyyy');
  disabled = input<boolean>(false);
  ariaLabel = input<string>('');

  readonly invalid = signal(false);
  readonly display = computed(() => {
    const value = this.value();
    const match = /^(\d{4})-(\d{2})$/.exec(value || '');
    return match ? `${match[2]}/${match[1]}` : '';
  });

  onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value.trim();
    if (!text) {
      this.invalid.set(false);
      this.value.set('');
      return;
    }
    const match = /^(\d{1,2})[/-](\d{4})$/.exec(text);
    if (!match) {
      this.invalid.set(true);
      return;
    }
    const month = Number(match[1]);
    const year = Number(match[2]);
    if (month < 1 || month > 12) {
      this.invalid.set(true);
      return;
    }
    this.invalid.set(false);
    this.value.set(`${year}-${String(month).padStart(2, '0')}`);
  }

  onBlur(event: Event): void {
    if (this.invalid()) {
      (event.target as HTMLInputElement).value = this.display();
      this.invalid.set(false);
    }
  }

  openPicker(native: HTMLInputElement): void {
    if (this.disabled()) {
      return;
    }
    if (typeof native.showPicker === 'function') {
      native.showPicker();
    } else {
      native.click();
    }
  }

  onNativeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.value.set(value);
    }
  }
}
