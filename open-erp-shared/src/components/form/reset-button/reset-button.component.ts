import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../button/button.component';
import { IconName } from '../../icon/icon.component';
import { ButtonSize } from '../../../enums/component.enum';

@Component({
  selector: 'erp-reset-button',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './reset-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetButtonComponent {
  readonly text = input<string>('Hủy bỏ / Đặt lại');
  readonly size = input<ButtonSize | 'sm' | 'md' | 'lg'>(ButtonSize.MD);
  readonly disabled = input<boolean>(false);
  readonly icon = input<IconName>('refresh-cw');
  readonly fullWidth = input<boolean>(false);
  readonly skeleton = input<boolean>(false);

  readonly resetClick = output<MouseEvent>();
}
