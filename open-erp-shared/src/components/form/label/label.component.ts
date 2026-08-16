import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';

@Component({
  selector: 'erp-label',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './label.component.html'
})
export class LabelComponent {
  @Input() text: string = '';
  @Input() forId?: string;
  @Input() required: boolean = false;
  @Input() optional: boolean = false;
  @Input() tooltip?: string;
  @Input() icon?: IconName;
  @Input() loading: boolean = false;
}
