import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PluginContributionOutletComponent,
  PluginHostContribution,
  PluginHostService,
  PluginSlotComponent,
  TabItem,
  TabStripComponent,
  TranslatePipe,
} from '@shared';
import { PluginContextService } from '../../../core/services/plugin-context.service';

interface SystemTab extends TabItem {
  contribution?: PluginHostContribution;
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    TabStripComponent,
    PluginSlotComponent,
    PluginContributionOutletComponent,
  ],
  templateUrl: './system-settings.component.html',
})
export class SystemSettingsComponent implements OnInit {
  host = inject(PluginHostService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  pluginContext = inject(PluginContextService);

  readonly loading = signal(true);
  readonly activeTab = signal('general');
  readonly coreTabs: ReadonlyArray<TabItem> = [
    { id: 'general', labelKey: 'SETTINGS_SYSTEM_TAB_GENERAL' },
    { id: 'plugins', labelKey: 'SETTINGS_SYSTEM_TAB_PLUGINS' },
  ];

  readonly pluginTabs = computed<SystemTab[]>(() => {
    const slot = this.host.slot('core.settings.system.tabs');
    const platform = typeof window !== 'undefined' && window.innerWidth < 1024 ? 'mobile' : 'desktop';
    return (slot?.contributions ?? [])
      .filter((contribution) => (contribution.platforms ?? ['desktop']).includes(platform))
      .map((contribution) => ({
        id: contribution.id || contribution.title_key,
        labelKey: contribution.title_key,
        contribution,
      }));
  });

  readonly tabs = computed<SystemTab[]>(() => [
    ...this.coreTabs.map((tab) => ({ ...tab })),
    ...this.pluginTabs(),
  ]);

  readonly activeContribution = computed<PluginHostContribution | null>(() =>
    this.tabs().find((tab) => tab.id === this.activeTab())?.contribution ?? null
  );

  readonly activeLabelKey = computed(() => {
    const active = this.tabs().find((tab) => tab.id === this.activeTab());
    return active?.labelKey ?? 'SETTINGS_SYSTEM_TAB_GENERAL';
  });

  readonly hostContractVersion = computed(
    () => this.host.slot('core.settings.system.tabs')?.host.contract_version ?? '1.0'
  );

  async ngOnInit(): Promise<void> {
    await this.host.loadManifest();
    this.loading.set(false);
    this.route.queryParamMap.subscribe((params) => {
      const requested = params.get('tab') || 'general';
      this.activeTab.set(this.tabs().some((tab) => tab.id === requested) ? requested : 'general');
    });
  }

  onTabChange(id: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  retry(): void {
    void this.host.loadManifest(true).then(() => this.loading.set(false));
  }
}
