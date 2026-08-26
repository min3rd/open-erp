import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { AppConfigService } from '../../services/app-config.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'erp-maintenance-banner',
  standalone: true,
  imports: [CommonModule, TranslocoModule, IconComponent],
  templateUrl: './maintenance-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaintenanceBannerComponent {
  readonly configService = inject(AppConfigService);

  readonly isNoticeDismissed = signal<boolean>(false);
  readonly isBypassed = signal<boolean>(false);

  dismissNotice(): void {
    this.isNoticeDismissed.set(true);
  }

  bypassMaintenance(): void {
    this.isBypassed.set(true);
  }

  reloadPage(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}
