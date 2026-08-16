import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../button/button.component';
import { IconName } from '../../icon/icon.component';
import { ButtonSize } from '../../../enums/component.enum';

@Component({
  selector: 'erp-reset-button',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './reset-button.component.html'
})
export class ResetButtonComponent {
  @Input() text: string = 'Hủy bỏ / Đặt lại';
  @Input() size: ButtonSize | 'sm' | 'md' | 'lg' = ButtonSize.MD;
  @Input() disabled: boolean = false;
  @Input() icon: IconName = 'refresh-cw';
  @Input() fullWidth: boolean = false;
  @Input() skeleton: boolean = false;

  @Output() resetClick = new EventEmitter<MouseEvent>();
}
