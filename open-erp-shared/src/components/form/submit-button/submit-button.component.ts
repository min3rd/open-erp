import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../button/button.component';
import { IconName } from '../../icon/icon.component';
import { ButtonSize } from '../../../enums/component.enum';

@Component({
  selector: 'erp-submit-button',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './submit-button.component.html'
})
export class SubmitButtonComponent {
  @Input() text: string = 'Lưu thông tin';
  @Input() size: ButtonSize | 'sm' | 'md' | 'lg' = ButtonSize.MD;
  @Input() submitting: boolean = false;
  @Input() disabled: boolean = false;
  @Input() icon: IconName = 'check';
  @Input() fullWidth: boolean = false;
  @Input() skeleton: boolean = false;

  @Output() submitClick = new EventEmitter<MouseEvent>();
}
