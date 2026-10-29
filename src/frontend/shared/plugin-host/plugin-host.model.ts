import { PluginRenderMode } from '../enums';

/** A plugin-provided screen mounted by the fixed core host. */
export interface PluginHostScreen {
  plugin_key: string;
  route: string;
  title_key: string;
  permission?: string;
  order?: number;
  render_mode: PluginRenderMode;
  /** Optional manifest override; defaults are derived from plugin_key. */
  entry?: string;
  tag_name?: string;
  exposed_module?: string;
  platforms?: string[];
  read_only?: boolean;
}

/** A component contributed by a plugin into a core- or plugin-hosted slot. */
export interface PluginHostContribution {
  id?: string;
  plugin_key: string;
  title_key: string;
  render_mode: PluginRenderMode;
  entry: string;
  tag_name?: string;
  exposed_module?: string;
  platforms?: string[];
  isolation?: 'shadow' | 'light';
  icon?: string;
  permission?: string;
  order?: number;
  contract_version: string;
}

export interface PluginHostSlot {
  slot_code: string;
  host: {
    type: 'CORE' | 'PLUGIN';
    plugin_key?: string;
    installed_version?: string;
    contract_version: string;
  };
  contributions: PluginHostContribution[];
}

export interface PluginUiManifest {
  contract_version?: string;
  screens: PluginHostScreen[];
  slots: PluginHostSlot[];
}

/** Context passed to every plugin contribution. Data is serializable; actions are callbacks. */
export interface PluginContext {
  theme: 'light' | 'dark';
  language: string;
  direction: 'ltr' | 'rtl';
  tenant: { id: string; name: string } | null;
  user: { id: string; name: string; email: string } | null;
  permissions: string[];
  apiBaseUrl: string;
  navigate?: (path: string) => void;
  notify?: (payload: PluginNotifyPayload) => void;
  resize?: () => void;
}

export interface PluginNotifyPayload {
  level: 'info' | 'success' | 'warning' | 'error';
  code: string;
  params?: Record<string, unknown>;
}

export interface PluginRuntimeSession {
  plugin_key: string;
  token: string;
  expires_in_seconds: number;
  entry: string;
}
