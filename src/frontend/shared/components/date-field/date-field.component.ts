import { Component, computed, input, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

/**
 * Date input that displays `dd/mm/yyyy` regardless of the browser locale.
 * The model stays ISO (`yyyy-mm-dd`) so API calls and URL state are unchanged.
 */
@Component({
  selector: 'app-date-field',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './date-field.component.html',
  host: { class: 'block' },
})
export class DateFieldComponent {
  value = model<string>('');
  placeholder = input<string>('dd/mm/yyyy');
  disabled = input<boolean>(false);
  ariaLabel = input<string>('');

  readonly invalid = signal(false);
  readonly display = computed(() => {
    const iso = this.value();
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return '';
    }
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  });

  onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value.trim();
    if (!text) {
      this.invalid.set(false);
      this.value.set('');
      return;
    }
    const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
    if (!match) {
      this.invalid.set(true);
      return;
    }
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      this.invalid.set(true);
      return;
    }
    this.invalid.set(false);
    this.value.set(
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    );
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
    const iso = (event.target as HTMLInputElement).value;
    if (iso) {
      this.value.set(iso);
    }
  }

  onDisplayChange(event: Event): void {
    // Keep the visible text aligned with the model when it changes externally.
    const target = event.target as HTMLInputElement;
    if (!this.invalid()) {
      target.value = this.display();
    }
  }
}
