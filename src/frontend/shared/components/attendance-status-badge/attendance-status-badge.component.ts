import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorVariant, ShapeVariant } from '../../enums';
import { TranslatePipe } from '../../i18n';

@Component({
  selector: 'app-attendance-status-badge',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './attendance-status-badge.component.html'
})
export class AttendanceStatusBadgeComponent {
  status = input<string>('ABSENT');
  needsReview = input<boolean>(false);
  shape = input<ShapeVariant | 'sharp' | 'soft'>(ShapeVariant.SHARP);

  readonly variant = computed<ColorVariant>(() => {
    switch (this.status()) {
      case 'PRESENT':
        return ColorVariant.SUCCESS;
      case 'HALF_DAY':
        return ColorVariant.WARNING;
      case 'WFH':
      case 'BUSINESS_TRIP':
        return ColorVariant.INFO;
      case 'ON_LEAVE':
        return ColorVariant.DEFAULT;
      case 'ABSENT':
      default:
        return ColorVariant.DANGER;
    }
  });

  readonly i18nKey = computed<string>(() => {
    return `attendance.status.${this.status()}`;
  });
}

