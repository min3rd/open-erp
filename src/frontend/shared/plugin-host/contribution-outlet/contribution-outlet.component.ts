import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { PluginRenderMode } from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PLUGIN_PERMISSION_CHECKER } from '../plugin-host.tokens';
import {
  PluginContext,
  PluginHostContribution,
  PluginNotifyPayload,
} from '../plugin-host.model';
import { PluginModuleFederationLoaderComponent } from '../module-federation-loader/module-federation-loader.component';
import { PluginWebComponentLoaderComponent } from '../web-component-loader/web-component-loader.component';

/**
 * Renders exactly one plugin contribution. Contract/permission/platform checks
 * happen here so a broken contribution is skipped without taking down the slot.
 */
@Component({
  selector: 'app-plugin-contribution-outlet',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    PluginWebComponentLoaderComponent,
    PluginModuleFederationLoaderComponent,
  ],
  templateUrl: './contribution-outlet.component.html',
})
export class PluginContributionOutletComponent implements OnInit {
  private permissionChecker = inject(PLUGIN_PERMISSION_CHECKER);

  contribution = input.required<PluginHostContribution>();
  context = input<PluginContext | null>(null);
  hostContractVersion = input<string>('1.0');

  failed = output<string>();
  routeChange = output<string>();
  navigate = output<string>();
  notify = output<PluginNotifyPayload>();

  readonly errorCode = signal<string | null>(null);
  readonly renderMode = PluginRenderMode;

  readonly contractMatches = computed(() =>
    major(this.contribution().contract_version) === major(this.hostContractVersion())
  );

  readonly platformMatches = computed(() => {
    const platforms = this.contribution().platforms;
    if (!platforms || platforms.length === 0) {
      return true;
    }
    return platforms.includes(isMobile() ? 'mobile' : 'desktop');
  });

  readonly permitted = computed(() => {
    const permission = this.contribution().permission;
    return !permission || this.permissionChecker(permission);
  });

  readonly canRender = computed(() =>
    this.contractMatches() && this.platformMatches() && this.permitted()
  );

  ngOnInit(): void {
    if (!this.contractMatches()) {
      console.warn('[plugin-host] contribution skipped: contract mismatch', {
        plugin: this.contribution().plugin_key,
        contribution: this.contribution().id,
        expected: this.hostContractVersion(),
        actual: this.contribution().contract_version,
      });
    }
  }

  onFailed(code: string): void {
    this.errorCode.set(code || 'PLUGIN_HOST_RENDER_ERROR');
    console.warn('[plugin-host] contribution failed to render', {
      plugin: this.contribution().plugin_key,
      contribution: this.contribution().id,
      code: this.errorCode(),
    });
    this.failed.emit(this.errorCode() ?? 'PLUGIN_HOST_RENDER_ERROR');
  }
}

function major(version: string | undefined): string {
  return (version ?? '1').split('.')[0];
}

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 1024;
}
