import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from '../models';
import { ThemeService } from '../theme/theme.service';
import { I18nService } from '../i18n/i18n.service';
import {
  PluginHostContribution,
  PluginHostSlot,
  PluginHostSlotHost,
  PluginRuntimeSession,
  PluginUiManifest,
} from './plugin-host.model';

const RUNTIME_PATH_PREFIX = '/plugins-runtime/';
const GATEWAY_PATH_PREFIX = '/api/v1/plugins/runtime/';

@Injectable({ providedIn: 'root' })
export class PluginHostService {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);
  private theme = inject(ThemeService);

  private manifestSignal = signal<PluginUiManifest | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private sessionSignal = signal<PluginRuntimeSession | null>(null);

  readonly manifest = this.manifestSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly slots = computed<PluginHostSlot[]>(() => this.manifestSignal()?.slots ?? []);

  async loadManifest(force = false): Promise<PluginUiManifest | null> {
    if (!force && this.manifestSignal()) {
      return this.manifestSignal();
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<PluginUiManifest>>('/api/v1/plugins/ui-manifest')
      );
      this.manifestSignal.set(response?.data ?? { screens: [], slots: [] });
      return this.manifestSignal();
    } catch {
      this.errorSignal.set('PLUGIN_HOST_UNAVAILABLE');
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  slot(slotCode: string): PluginHostSlot | null {
    return this.slots().find((slot) => slot.slot_code === slotCode) ?? null;
  }

  runtimeEntryUrl(entry: string): string {
    if (!entry) {
      return entry;
    }
    if (entry.startsWith(RUNTIME_PATH_PREFIX)) {
      return GATEWAY_PATH_PREFIX + entry.substring(RUNTIME_PATH_PREFIX.length);
    }
    return entry;
  }

  contractMatches(host: PluginHostSlotHost | undefined, contribution: PluginHostContribution): boolean {
    if (!host || !contribution.contract_version) {
      return true;
    }
    if (host.type === 'CORE') {
      return !host.contract_version || host.contract_version === contribution.contract_version;
    }
    return host.installed_version !== undefined
      && !!host.contract_version
      && host.contract_version === contribution.contract_version;
  }

  async session(pluginKey: string): Promise<PluginRuntimeSession | null> {
    const cached = this.sessionSignal();
    if (cached && cached.plugin_key === pluginKey) {
      return cached;
    }
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<PluginRuntimeSession>>('/api/v1/plugins/session-token', {
          plugin_key: pluginKey,
        })
      );
      this.sessionSignal.set(response?.data ?? null);
      return response?.data ?? null;
    } catch {
      return null;
    }
  }

  themeMode(): string {
    return this.theme.mode();
  }

  language(): string {
    return this.i18n.currentLang();
  }
}
