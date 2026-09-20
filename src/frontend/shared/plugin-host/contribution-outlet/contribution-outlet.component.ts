import { CommonModule } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PluginRenderMode } from '../../enums';
import { PluginHostContribution, PluginHostSlotHost } from '../plugin-host.model';
import { PluginHostService } from '../plugin-host.service';
import { PLUGIN_PERMISSION_CHECKER } from '../plugin-host.tokens';
import { PluginIframeLoaderComponent } from '../iframe-loader/iframe-loader.component';
import { PluginModuleFederationLoaderComponent } from '../module-federation-loader/module-federation-loader.component';
import { PluginWebComponentLoaderComponent } from '../web-component-loader/web-component-loader.component';

@Component({
  selector: 'app-contribution-outlet',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    PluginWebComponentLoaderComponent,
    PluginModuleFederationLoaderComponent,
    PluginIframeLoaderComponent,
  ],
  templateUrl: './contribution-outlet.component.html',
})
export class ContributionOutletComponent {
  private permissionChecker = inject(PLUGIN_PERMISSION_CHECKER);
  private hostService = inject(PluginHostService);

  contribution = input.required<PluginHostContribution>();
  host = input<PluginHostSlotHost | undefined>(undefined);

  renderMode = PluginRenderMode;
  failed = signal<boolean>(false);

  visible(): boolean {
    return this.permissionChecker(this.contribution().permission);
  }

  contractMatches(): boolean {
    return this.hostService.contractMatches(this.host(), this.contribution());
  }

  entryUrl(): string {
    return this.hostService.runtimeEntryUrl(this.contribution().entry);
  }

  minHeight(): number {
    return this.contribution().min_height_px ?? 120;
  }

  onFailed(): void {
    this.failed.set(true);
  }
}
