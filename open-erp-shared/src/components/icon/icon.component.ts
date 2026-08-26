import { Component, ChangeDetectionStrategy, input, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';

export type IconName = string;

export const provideSharedIcons = () => importProvidersFrom(FeatherModule.pick(allIcons));

@Component({
  selector: 'erp-icon',
  standalone: true,
  imports: [CommonModule, FeatherModule],
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  readonly name = input<string>('info');
  readonly size = input<number | string>(18);
  readonly strokeWidth = input<number>(2);
  readonly className = input<string>('');
}
