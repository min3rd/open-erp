import { Injectable, signal, computed } from '@angular/core';
import { AppConfig, ThemeColorPalette } from '../models/app-config.model';

export const DEFAULT_SHARED_CONFIG: AppConfig = {
  app: {
    name: 'Open ERP System',
    shortName: 'OpenERP',
    version: '1.0.0',
    environment: 'development',
    copyright: '© 2026 Open ERP System. All rights reserved.'
  },
  api: {
    baseUrl: 'http://localhost:8080',
    authServiceUrl: 'http://localhost:10001',
    coreServiceUrl: 'http://localhost:8080',
    sampleServiceUrl: 'http://localhost:10002',
    timeoutMs: 30000,
    retryAttempts: 2
  },
  i18n: {
    defaultLanguage: 'vi',
    fallbackLanguage: 'en',
    availableLanguages: [
      { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', isRtl: false },
      { code: 'en', name: 'English', flag: '🇺🇸', isRtl: false }
    ]
  },
  themes: {
    defaultTheme: 'light',
    enableDarkMode: true,
    colors: {
      light: {
        primary: '#4f46e5',
        primaryHover: '#4338ca',
        secondary: '#06b6d4',
        background: '#f8fafc',
        surface: '#ffffff',
        surfaceBorder: '#e2e8f0',
        textPrimary: '#0f172a',
        textSecondary: '#64748b',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      dark: {
        primary: '#6366f1',
        primaryHover: '#4f46e5',
        secondary: '#22d3ee',
        background: '#020617',
        surface: '#0f172a',
        surfaceBorder: '#1e293b',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171'
      }
    }
  },
  maintenance: {
    enabled: false,
    allowAdminBypass: true,
    title: 'Hệ thống đang được nâng cấp bảo trì định kỳ',
    message: 'Chúng tôi đang tiến hành cập nhật hệ thống. Vui lòng quay lại sau ít phút.',
    estimatedEndTime: '2026-08-16T18:00:00+07:00',
    supportEmail: 'support@vn9melody.com',
    supportHotline: '1900-8888'
  },
  systemNotice: {
    enabled: false,
    id: 'default-notice',
    type: 'INFO',
    title: 'Thông báo',
    content: '',
    dismissible: true
  }
};

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private configSignal = signal<AppConfig>(DEFAULT_SHARED_CONFIG);

  readonly config = this.configSignal.asReadonly();
  readonly api = computed(() => this.configSignal().api);
  readonly i18n = computed(() => this.configSignal().i18n);
  readonly themes = computed(() => this.configSignal().themes);
  readonly maintenance = computed(() => this.configSignal().maintenance);
  readonly systemNotice = computed(() => this.configSignal().systemNotice);

  async loadConfig(configPath: string = '/config/app-config.json'): Promise<AppConfig> {
    try {
      const response = await fetch(`${configPath}?v=${Date.now()}`);
      if (response.ok) {
        const data: AppConfig = await response.json();
        this.configSignal.set(data);
        return data;
      }
    } catch (err) {
      console.warn('[AppConfigService] Failed to load config from', configPath, err);
    }
    return DEFAULT_SHARED_CONFIG;
  }

  applyThemePalette(isDark: boolean): void {
    if (typeof document === 'undefined') return;
    const themeConfig = this.configSignal().themes;
    const colors: ThemeColorPalette = isDark ? themeConfig.colors.dark : themeConfig.colors.light;
    const root = document.documentElement;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-surface-border', colors.surfaceBorder);
    root.style.setProperty('--color-text-primary', colors.textPrimary);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-danger', colors.danger);
  }
}
