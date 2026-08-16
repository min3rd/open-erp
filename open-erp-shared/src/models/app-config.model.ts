export interface AppMetadataConfig {
  name: string;
  shortName: string;
  version: string;
  environment: string;
  copyright: string;
}

export interface ApiConfig {
  baseUrl: string;
  authServiceUrl: string;
  coreServiceUrl: string;
  sampleServiceUrl: string;
  timeoutMs: number;
  retryAttempts: number;
}

export interface LanguageItem {
  code: string;
  name: string;
  flag: string;
  isRtl?: boolean;
}

export interface I18nConfig {
  defaultLanguage: string;
  fallbackLanguage: string;
  availableLanguages: LanguageItem[];
}

export interface ThemeColorPalette {
  primary: string;
  primaryHover: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  warning: string;
  danger: string;
}

export interface ThemeConfig {
  defaultTheme: 'light' | 'dark';
  enableDarkMode: boolean;
  colors: {
    light: ThemeColorPalette;
    dark: ThemeColorPalette;
  };
}

export interface MaintenanceConfig {
  enabled: boolean;
  allowAdminBypass: boolean;
  title: string;
  message: string;
  estimatedEndTime?: string;
  supportEmail?: string;
  supportHotline?: string;
}

export interface SystemNoticeConfig {
  enabled: boolean;
  id: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  content: string;
  dismissible: boolean;
}

export interface AppConfig {
  app: AppMetadataConfig;
  api: ApiConfig;
  i18n: I18nConfig;
  themes: ThemeConfig;
  maintenance: MaintenanceConfig;
  systemNotice: SystemNoticeConfig;
}
