import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { EmptyStateType } from '../../enums/component.enum';

@Component({
  selector: 'erp-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './empty-state.component.html'
})
export class EmptyStateComponent {
  @Input() title: string = 'Không tìm thấy dữ liệu';
  @Input() description: string = '';
  @Input() type: EmptyStateType | 'no-data' | 'not-found' | 'error' | 'maintenance' = EmptyStateType.NO_DATA;
  @Input() customIcon?: IconName;
  @Input() loading: boolean = false;

  getIconName(): IconName {
    if (this.customIcon) return this.customIcon;
    switch (this.type) {
      case EmptyStateType.NOT_FOUND:
      case 'not-found':
        return 'search';
      case EmptyStateType.ERROR:
      case 'error':
        return 'alert-circle';
      case EmptyStateType.MAINTENANCE:
      case 'maintenance':
        return 'alert-triangle';
      case EmptyStateType.NO_DATA:
      case 'no-data':
      default:
        return 'inbox';
    }
  }
}
