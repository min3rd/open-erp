import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * oerp-form-number
 * Ô nhập số với hỗ trợ: min, max, step, prefix icon, suffix đơn vị
 *
 * Usage:
 *   <oerp-form-number [control]="amountControl" label="Số tiền" unit="VNĐ" [min]="0" />
 */
@Component({
  selector: 'oerp-form-number',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, IconComponent, TranslocoPipe],
  templateUrl: './form-number.component.html',
})
export class FormNumberComponent {
  label = input<string>('');
  placeholder = input<string>('0');
  control = input<FormControl>(new FormControl());
  errorMessage = input<string>('');
  /** Đơn vị hiển thị bên phải (VD: VNĐ, kg, %) */
  unit = input<string | undefined>(undefined);
  /** Icon bên trái */
  prefixIcon = input<string | undefined>(undefined);
  min = input<number | undefined>(undefined);
  max = input<number | undefined>(undefined);
  step = input<number>(1);
  /** Cho phép nhập số thập phân */
  allowDecimal = input<boolean>(false);

  hasError(): boolean {
    const ctrl = this.control();
    return ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }
}
