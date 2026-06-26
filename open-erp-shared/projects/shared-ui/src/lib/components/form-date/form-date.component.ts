import { Component, input, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * oerp-form-date
 * Date picker sử dụng native <input type="date"> / <input type="datetime-local">
 * Tích hợp FormControl, hỗ trợ min/max date, mode date / datetime
 *
 * Usage:
 *   <oerp-form-date [control]="dateControl" label="Ngày bắt đầu" mode="date" />
 */
@Component({
  selector: 'oerp-form-date',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, IconComponent, TranslocoPipe],
  templateUrl: './form-date.component.html',
})
export class FormDateComponent {
  label = input<string>('');
  control = input<FormControl>(new FormControl());
  errorMessage = input<string>('');
  /** 'date' | 'datetime-local' | 'month' | 'week' */
  mode = input<'date' | 'datetime-local' | 'month' | 'week'>('date');
  /** Giá trị min dạng YYYY-MM-DD */
  minDate = input<string | undefined>(undefined);
  /** Giá trị max dạng YYYY-MM-DD */
  maxDate = input<string | undefined>(undefined);

  hasError(): boolean {
    const ctrl = this.control();
    return ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }
}
