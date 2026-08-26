import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../button/button.component';
import { IconName } from '../../icon/icon.component';
import { ButtonSize } from '../../../enums/component.enum';

@Component({
  selector: 'erp-submit-button',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './submit-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmitButtonComponent {
  readonly text = input<string>('Lưu thông tin');
  readonly size = input<ButtonSize | 'sm' | 'md' | 'lg'>(ButtonSize.MD);
  readonly submitting = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly icon = input<IconName>('check');
  readonly fullWidth = input<boolean>(false);
  readonly skeleton = input<boolean>(false);

  readonly submitClick = output<MouseEvent>();
}
