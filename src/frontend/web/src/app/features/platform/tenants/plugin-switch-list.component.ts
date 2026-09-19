import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, PlatformPlugin, SharpToggleComponent, TranslatePipe } from '@shared';

export interface PluginToggleEvent {
  key: string;
  checked: boolean;
}

export interface PluginSwitchItem extends PlatformPlugin {
  inCatalog: boolean;
}

const CORE_PLUGIN_KEY = 'core';

@Component({
  selector: 'app-plugin-switch-list',
  standalone: true,
  imports: [CommonModule, SharpToggleComponent, TranslatePipe],
  templateUrl: './plugin-switch-list.component.html'
})
export class PluginSwitchListComponent {
  private i18n = inject(I18nService);

  items = input<PlatformPlugin[]>([]);
  plugins = input<string[]>([]);
  disabled = input<boolean>(false);

  toggled = output<PluginToggleEvent>();

  readonly query = signal<string>('');

  readonly requiredItems = computed<PluginSwitchItem[]>(() =>
    this.items()
      .filter((item) => item.is_core)
      .map((item) => ({ ...item, inCatalog: true }))
  );

  readonly optionalItems = computed<PluginSwitchItem[]>(() => {
    const catalog = this.items()
      .filter((item) => !item.is_core)
      .map((item) => ({
        ...item,
        inCatalog: !!(item.name_key || item.description_key)
      }));
    const catalogKeys = new Set(catalog.map((item) => item.key));
    const unknown = this.plugins()
      .filter((key) => key !== CORE_PLUGIN_KEY && !catalogKeys.has(key))
      .map<PluginSwitchItem>((key) => ({
        key,
        name_key: '',
        description_key: '',
        is_core: false,
        inCatalog: false
      }));
    return [...catalog, ...unknown];
  });

  private readonly allItems = computed<PluginSwitchItem[]>(() => [
    ...this.requiredItems(),
    ...this.optionalItems()
  ]);

  readonly enabledCount = computed<number>(() =>
    this.allItems().filter((item) => this.isChecked(item.key)).length
  );

  readonly totalCount = computed<number>(() => this.allItems().length);

  readonly searching = computed<boolean>(() => this.query().trim().length > 0);

  readonly filteredRequiredItems = computed<PluginSwitchItem[]>(() =>
    this.filterItems(this.requiredItems())
  );

  readonly filteredOptionalItems = computed<PluginSwitchItem[]>(() =>
    this.filterItems(this.optionalItems())
  );

  readonly visibleCount = computed<number>(
    () => this.filteredRequiredItems().length + this.filteredOptionalItems().length
  );

  displayName(item: PluginSwitchItem): string {
    return item.name_key ? this.i18n.t(item.name_key) : item.key;
  }

  isChecked(key: string): boolean {
    return this.plugins().includes(key);
  }

  onSearch(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.query.set('');
  }

  onToggle(item: PluginSwitchItem, checked: boolean) {
    if (item.is_core) {
      return;
    }
    this.toggled.emit({ key: item.key, checked });
  }

  private filterItems(items: PluginSwitchItem[]): PluginSwitchItem[] {
    const keyword = this.query().trim().toLowerCase();
    if (!keyword) {
      return items;
    }
    return items.filter(
      (item) =>
        item.key.toLowerCase().includes(keyword) ||
        this.displayName(item).toLowerCase().includes(keyword)
    );
  }
}
