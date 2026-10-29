import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from '../models';
import { I18nService } from '../i18n/i18n.service';
import { API_BASE_URL } from '../services/api.service';
import {
  PluginHostSlot,
  PluginRuntimeSession,
  PluginUiManifest,
} from './plugin-host.model';

const RUNTIME_PATH_PREFIX = '/plugins-runtime/';
const GATEWAY_PATH_PREFIX = '/api/v1/plugins/runtime/';
/** Refresh ahead of expiry so a request never races the token TTL. */
const SESSION_SKEW_MS = 30_000;

const EMPTY_MANIFEST: PluginUiManifest = {
  contract_version: '1.0',
  screens: [],
  slots: [],
};

@Injectable({ providedIn: 'root' })
export class PluginHostService {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);
  /** Empty when the host proxies `/api` on the same origin (web); absolute on mobile. */
  private apiBaseUrl = (inject(API_BASE_URL) ?? '').replace(/\/$/, '');

  private manifestSignal = signal<PluginUiManifest | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private manifestRequest: Promise<PluginUiManifest | null> | null = null;
  /** Runtime tokens are per plugin: two contributions may load concurrently. */
  private sessions = new Map<string, { session: PluginRuntimeSession; expiresAt: number }>();

  readonly manifest = this.manifestSignal.asReadonly();
  readonly screens = computed(() => this.manifestSignal()?.screens ?? []);
  readonly slots = computed(() => this.manifestSignal()?.slots ?? []);
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  slot(slotCode: string): PluginHostSlot | null {
    return this.slots().find((slot) => slot.slot_code === slotCode) ?? null;
  }

  async loadManifest(force = false): Promise<PluginUiManifest | null> {
    if (!force && this.manifestSignal()) {
      return this.manifestSignal();
    }
    if (!force && this.manifestRequest) {
      return this.manifestRequest;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.manifestRequest = this.fetchManifest();
    const manifest = await this.manifestRequest;
    this.manifestRequest = null;
    return manifest;
  }

  private async fetchManifest(): Promise<PluginUiManifest | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<PluginUiManifest>>(`${this.apiBaseUrl}/api/v1/plugins/ui-manifest`)
      );
      const manifest = response?.data ?? EMPTY_MANIFEST;
      this.manifestSignal.set({
        contract_version: manifest.contract_version ?? '1.0',
        screens: manifest.screens ?? [],
        slots: manifest.slots ?? [],
      });
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
      return this.apiBaseUrl + GATEWAY_PATH_PREFIX + entry.substring(RUNTIME_PATH_PREFIX.length);
    }
    return entry;
  }

  async runtimeUrlWithToken(entry: string, pluginKey: string, forceSession = false): Promise<string> {
    const mapped = this.runtimeEntryUrl(entry);
    if (!mapped.startsWith(this.apiBaseUrl + GATEWAY_PATH_PREFIX)) {
      return mapped;
    }
    const session = await this.session(pluginKey, forceSession);
    if (!session?.token) {
      return mapped;
    }
    const separator = mapped.includes('?') ? '&' : '?';
    return `${mapped}${separator}plugin_token=${encodeURIComponent(session.token)}`;
  }

  async session(pluginKey: string, force = false): Promise<PluginRuntimeSession | null> {
    // A tenant switch or re-login replaces the Core JWT; never reuse the
    // previous user's plugin token in that case.
    const authToken = typeof localStorage === 'undefined'
      ? ''
      : (localStorage.getItem('openerp_token') ?? '').slice(-24);
    const cacheKey = `${pluginKey}:${authToken}`;
    const cached = this.sessions.get(cacheKey);
    if (!force && cached && Date.now() + SESSION_SKEW_MS < cached.expiresAt) {
      return cached.session;
    }
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<PluginRuntimeSession>>(`${this.apiBaseUrl}/api/v1/plugins/session-token`, {
          plugin_key: pluginKey,
        })
      );
      const session = response?.data ?? null;
      if (session) {
        this.sessions.set(cacheKey, {
          session,
          expiresAt: session.expires_in_seconds
            ? Date.now() + session.expires_in_seconds * 1000
            : 0,
        });
      } else {
        this.sessions.delete(cacheKey);
      }
      return session;
    } catch {
      this.sessions.delete(cacheKey);
      return null;
    }
  }

  themeMode(): string {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  language(): string {
    return this.i18n.currentLang();
  }
}
