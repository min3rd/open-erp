import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { AppConfigService } from '@open-erp/shared';

@Component({
  selector: 'app-maintenance-banner',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
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
}
