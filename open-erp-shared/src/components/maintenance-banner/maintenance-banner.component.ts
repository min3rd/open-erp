import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { AppConfigService } from '../../services/app-config.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'erp-maintenance-banner',
  standalone: true,
  imports: [CommonModule, TranslocoModule, IconComponent],
  templateUrl: './maintenance-banner.component.html'
})
export class MaintenanceBannerComponent {
  configService = inject(AppConfigService);

  isNoticeDismissed = signal<boolean>(false);
  isBypassed = signal<boolean>(false);

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
