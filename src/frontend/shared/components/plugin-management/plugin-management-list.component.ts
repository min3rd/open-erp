import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import {
  PluginCatalogStatus,
  TenantPluginStatus,
} from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PluginMarketplaceItem } from '../../models/plugin.model';
import { PluginCardComponent } from '../plugin-card/plugin-card.component';
import { SharpButtonComponent } from '../sharp-button/sharp-button.component';

@Component({
  selector: 'app-plugin-management-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe, PluginCardComponent, SharpButtonComponent],
  templateUrl: './plugin-management-list.component.html',
})
export class PluginManagementListComponent {
  items = input<PluginMarketplaceItem[]>([]);
  busyKey = input<string | null>(null);
  selectedKey = input<string | null>(null);
  showCustomGroup = input<boolean>(true);

  install = output<PluginMarketplaceItem>();
  uninstall = output<PluginMarketplaceItem>();
  enable = output<PluginMarketplaceItem>();
  disable = output<PluginMarketplaceItem>();
  upgrade = output<PluginMarketplaceItem>();
  detail = output<PluginMarketplaceItem>();
  registerCustom = output<void>();

  query = signal<string>('');

  installedItems = computed<PluginMarketplaceItem[]>(() =>
    this.filter(this.items().filter((item) => !item.is_custom && this.isInstalled(item)))
  );

  availableItems = computed<PluginMarketplaceItem[]>(() =>
    this.filter(this.items().filter((item) => !item.is_custom && !this.isInstalled(item)))
  );

  customItems = computed<PluginMarketplaceItem[]>(() =>
    this.showCustomGroup() ? this.filter(this.items().filter((item) => item.is_custom)) : []
  );

  empty = computed<boolean>(
    () =>
      this.installedItems().length === 0
      && this.availableItems().length === 0
      && this.customItems().length === 0
  );

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.query.set('');
  }

  isInstalled(item: PluginMarketplaceItem): boolean {
    return !!item.status && item.status !== TenantPluginStatus.UNINSTALLED;
  }

  canUpgrade(item: PluginMarketplaceItem): boolean {
    return (
      this.isInstalled(item)
      && !!item.update_available
      && item.status !== TenantPluginStatus.INSTALLING
      && item.status !== TenantPluginStatus.UPGRADING
    );
  }

  isBusy(item: PluginMarketplaceItem): boolean {
    return this.busyKey() === item.plugin_key
      || item.status === TenantPluginStatus.INSTALLING
      || item.status === TenantPluginStatus.UPGRADING;
  }

  isBlocked(item: PluginMarketplaceItem): boolean {
    return item.catalog_status === PluginCatalogStatus.BLOCKED;
  }

  actionsDisabled(item: PluginMarketplaceItem): boolean {
    return this.isBusy(item) || this.isBlocked(item);
  }

  private filter(items: PluginMarketplaceItem[]): PluginMarketplaceItem[] {
    const keyword = this.query().trim().toLowerCase();
    if (!keyword) {
      return items;
    }
    return items.filter(
      (item) => item.plugin_key.toLowerCase().includes(keyword)
    );
  }
}
