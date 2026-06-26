import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * oerp-form-field-wrapper
 * Container chuẩn hóa bọc mọi form control:
 *   Label (với indicator bắt buộc) + ng-content + helper text + error message
 *
 * Usage:
 *   <oerp-form-field-wrapper label="Họ và tên" [required]="true" [errorMessage]="'Bắt buộc nhập'">
 *     <oerp-input [control]="nameControl" />
 *   </oerp-form-field-wrapper>
 */
@Component({
  selector: 'oerp-form-field-wrapper',
  standalone: true,
  imports: [NgClass, TranslocoPipe],
  templateUrl: './form-field-wrapper.component.html',
})
export class FormFieldWrapperComponent {
  label = input<string>('');
  required = input<boolean>(false);
  helperText = input<string>('');
  errorMessage = input<string>('');
  /** Nếu true: hiển thị error styling */
  hasError = input<boolean>(false);
  /** Thêm CSS class tùy chỉnh vào wrapper */
  wrapperClass = input<string>('');
}
