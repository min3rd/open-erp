import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { EmptyStateType } from '../../enums/component.enum';

const ICONS: Record<string, IconName> = {
  [EmptyStateType.NOT_FOUND]: 'search',
  [EmptyStateType.ERROR]: 'alert-circle',
  [EmptyStateType.MAINTENANCE]: 'alert-triangle',
  [EmptyStateType.NO_DATA]: 'inbox'
};

@Component({
  selector: 'erp-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  readonly title = input<string>('Không tìm thấy dữ liệu');
  readonly description = input<string>('');
  readonly type = input<EmptyStateType | 'no-data' | 'not-found' | 'error' | 'maintenance'>(EmptyStateType.NO_DATA);
  readonly customIcon = input<IconName | undefined>(undefined);
  readonly loading = input<boolean>(false);

  readonly iconName = computed(() => {
    const custom = this.customIcon();
    if (custom) return custom;
    const t = String(this.type());
    return ICONS[t] || ICONS[EmptyStateType.NO_DATA];
  });
}
