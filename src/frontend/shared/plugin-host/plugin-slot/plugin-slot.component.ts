import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PluginHostService } from '../plugin-host.service';
import {
  PluginContext,
  PluginHostContribution,
  PluginNotifyPayload,
} from '../plugin-host.model';
import { PluginContributionOutletComponent } from '../contribution-outlet/contribution-outlet.component';

/**
 * Core-owned slot renderer. It resolves contributions from the UI manifest and
 * delegates each one to the outlet. Plugins only declare a slot + component;
 * the core decides where and whether it is rendered.
 */
@Component({
  selector: 'app-plugin-slot',
  standalone: true,
  imports: [CommonModule, TranslatePipe, PluginContributionOutletComponent],
  templateUrl: './plugin-slot.component.html',
})
export class PluginSlotComponent implements OnInit {
  private hostService = inject(PluginHostService);

  slot = input.required<string>();
  context = input<PluginContext | null>(null);
  emptyKey = input<string>('PLUGIN_SLOT_EMPTY');
  maxContributions = input<number | null>(null);

  failed = output<{ contribution: PluginHostContribution; code: string }>();
  routeChange = output<string>();
  navigate = output<string>();
  notify = output<PluginNotifyPayload>();

  readonly host = computed(() => this.hostService.slot(this.slot()));
  readonly contributions = computed(() => {
    const contributions = [...(this.host()?.contributions ?? [])];
    const limit = this.maxContributions();
    return limit && limit > 0 ? contributions.slice(0, limit) : contributions;
  });
  readonly hostContractVersion = computed(() => this.host()?.host.contract_version ?? '1.0');

  ngOnInit(): void {
    if (!this.hostService.manifest()) {
      void this.hostService.loadManifest();
    }
  }

  trackContribution(_index: number, contribution: PluginHostContribution): string {
    return `${contribution.plugin_key}:${contribution.id ?? contribution.title_key}`;
  }
}
