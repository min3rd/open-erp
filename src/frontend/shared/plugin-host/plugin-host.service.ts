import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from '../models';
import { ThemeService } from '../theme/theme.service';
import { I18nService } from '../i18n/i18n.service';
import { PluginRuntimeSession, PluginUiManifest } from './plugin-host.model';

const RUNTIME_PATH_PREFIX = '/plugins-runtime/';
const GATEWAY_PATH_PREFIX = '/api/v1/plugins/runtime/';
/** Refresh ahead of expiry so a request never races the token TTL. */
const SESSION_SKEW_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class PluginHostService {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);
  private theme = inject(ThemeService);

  private manifestSignal = signal<PluginUiManifest | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private sessionSignal = signal<PluginRuntimeSession | null>(null);
  private sessionExpiresAt = 0;

  readonly manifest = this.manifestSignal.asReadonly();
  readonly screens = computed(() => this.manifestSignal()?.screens ?? []);
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

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
      this.manifestSignal.set(response?.data ?? { screens: [] });
      return this.manifestSignal();
    } catch {
      this.errorSignal.set('PLUGIN_HOST_UNAVAILABLE');
      return null;
    } finally {
      this.loadingSignal.set(false);
    }
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

  async runtimeUrlWithToken(entry: string, pluginKey: string): Promise<string> {
    const mapped = this.runtimeEntryUrl(entry);
    if (!mapped.startsWith(GATEWAY_PATH_PREFIX)) {
      return mapped;
    }
    const session = await this.session(pluginKey);
    if (!session?.token) {
      return mapped;
    }
    const separator = mapped.includes('?') ? '&' : '?';
    return `${mapped}${separator}plugin_token=${encodeURIComponent(session.token)}`;
  }

  async session(pluginKey: string, force = false): Promise<PluginRuntimeSession | null> {
    const cached = this.sessionSignal();
    if (!force && cached && cached.plugin_key === pluginKey && Date.now() + SESSION_SKEW_MS < this.sessionExpiresAt) {
      return cached;
    }
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<PluginRuntimeSession>>('/api/v1/plugins/session-token', {
          plugin_key: pluginKey,
        })
      );
      const session = response?.data ?? null;
      this.sessionSignal.set(session);
      this.sessionExpiresAt = session?.expires_in_seconds
        ? Date.now() + session.expires_in_seconds * 1000
        : 0;
      return session;
    } catch {
      this.sessionSignal.set(null);
      this.sessionExpiresAt = 0;
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
