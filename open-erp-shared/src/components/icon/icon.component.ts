import { Component, Input, importProvidersFrom } from '@angular/core';
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
  styleUrls: ['./icon.component.css']
})
export class IconComponent {
  @Input() name: string = 'info';
  @Input() size: number | string = 18;
  @Input() strokeWidth: number = 2;
  @Input() className: string = '';
}
