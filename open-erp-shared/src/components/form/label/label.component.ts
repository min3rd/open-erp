import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';

@Component({
  selector: 'erp-label',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './label.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelComponent {
  readonly text = input<string>('');
  readonly forId = input<string | undefined>(undefined);
  readonly required = input<boolean>(false);
  readonly optional = input<boolean>(false);
  readonly tooltip = input<string | undefined>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
  readonly loading = input<boolean>(false);
}
