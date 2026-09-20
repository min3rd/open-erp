import { CommonModule } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import {
  PluginCatalogStatus,
  TenantPluginStatus,
} from '../../enums';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'app-plugin-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BadgeComponent],
  templateUrl: './plugin-card.component.html',
})
export class PluginCardComponent {
  private i18n = inject(I18nService);

  pluginKey = input.required<string>();
  nameKey = input<string>('');
  descriptionKey = input<string>('');
  status = input<TenantPluginStatus | PluginCatalogStatus | string | null>(null);
  installedVersion = input<string | null>(null);
  latestVersion = input<string | null>(null);
  updateAvailable = input<boolean>(false);
  isCustom = input<boolean>(false);
  catalogBlocked = input<boolean>(false);
  locked = input<boolean>(false);
  selected = input<boolean>(false);

  picked = output<string>();

  displayName(): string {
    return this.nameKey() ? this.i18n.t(this.nameKey()) : this.pluginKey();
  }

  statusKey(): string | null {
    const status = this.status();
    if (!status) {
      return null;
    }
    return `PLUGIN_STATUS_${status}`;
  }

  statusVariant(): string {
    switch (this.status()) {
      case TenantPluginStatus.ACTIVE:
      case PluginCatalogStatus.ACTIVE:
        return 'success';
      case TenantPluginStatus.INSTALLING:
      case TenantPluginStatus.UPGRADING:
        return 'warning';
      case TenantPluginStatus.INSTALL_FAILED:
      case TenantPluginStatus.ROLLBACK_FAILED:
      case PluginCatalogStatus.BLOCKED:
        return 'danger';
      default:
        return 'neutral';
    }
  }

  onPick(): void {
    this.picked.emit(this.pluginKey());
  }
}
