import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PluginHostContribution, PluginHostSlotHost } from '../plugin-host.model';
import { PluginHostService } from '../plugin-host.service';
import { ContributionOutletComponent } from '../contribution-outlet/contribution-outlet.component';

@Component({
  selector: 'app-plugin-slot',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ContributionOutletComponent],
  templateUrl: './plugin-slot.component.html',
})
export class PluginSlotComponent {
  private hostService = inject(PluginHostService);

  slotCode = input.required<string>();
  host = input<PluginHostSlotHost | undefined>(undefined);

  loading = signal<boolean>(false);
  private loaded = false;

  constructor() {
    effect(() => {
      if (this.loaded) {
        return;
      }
      this.loaded = true;
      this.loading.set(true);
      void this.hostService.loadManifest().finally(() => this.loading.set(false));
    });
  }

  contributions(): PluginHostContribution[] {
    const slot = this.hostService.slot(this.slotCode());
    if (!slot) {
      return [];
    }
    return [...slot.contributions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  slotHost(): PluginHostSlotHost | undefined {
    return this.host() ?? this.hostService.slot(this.slotCode())?.host;
  }

  trackContribution(index: number, contribution: PluginHostContribution): string {
    return `${contribution.plugin_key}:${contribution.title_key}:${index}`;
  }
}
