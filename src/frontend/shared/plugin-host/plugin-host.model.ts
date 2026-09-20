import { PluginRenderMode } from '../enums';

export interface PluginHostScreen {
  plugin_key: string;
  route: string;
  title_key: string;
  permission?: string;
  order?: number;
  render_mode: PluginRenderMode;
}

export interface PluginHostSlotHost {
  type: 'CORE' | 'PLUGIN';
  plugin_key?: string;
  installed_version?: string;
  contract_version?: string;
}

export interface PluginHostContribution {
  plugin_key: string;
  title_key: string;
  render_mode: PluginRenderMode;
  entry: string;
  permission?: string;
  order?: number;
  contract_version?: string;
  min_height_px?: number;
  exposed_module?: string;
  element?: string;
}

export interface PluginHostSlot {
  slot_code: string;
  host: PluginHostSlotHost;
  contributions: PluginHostContribution[];
}

export interface PluginUiManifest {
  screens: PluginHostScreen[];
  slots: PluginHostSlot[];
}

export interface PluginRuntimeSession {
  plugin_key: string;
  token: string;
  expires_in_seconds: number;
  entry: string;
}
