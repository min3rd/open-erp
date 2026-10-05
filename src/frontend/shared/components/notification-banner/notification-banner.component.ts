import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationSeverity } from '../../enums';
import { PluginNotification } from '../../models';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * Global amber/red strip for unread WARNING/CRITICAL plugin notifications.
 * Renders nothing when there is no warning. Presentational; the host loads and
 * optionally dismisses it.
 */
@Component({
  selector: 'app-notification-banner',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './notification-banner.component.html'
})
export class NotificationBannerComponent {
  items = input<PluginNotification[]>([]);
  detailPath = input<string | null>(null);
  dismissible = input<boolean>(false);

  dismiss = output<void>();

  readonly alerts = computed(() =>
    this.items().filter(item =>
      item.severity === NotificationSeverity.WARNING || item.severity === NotificationSeverity.CRITICAL
    )
  );

  readonly critical = computed(() =>
    this.alerts().some(item => item.severity === NotificationSeverity.CRITICAL)
  );
}
