import { PluginRenderMode } from '../enums';

export interface PluginHostScreen {
  plugin_key: string;
  route: string;
  title_key: string;
  permission?: string;
  order?: number;
  render_mode: PluginRenderMode;
}

export interface PluginUiManifest {
  screens: PluginHostScreen[];
}

export interface PluginRuntimeSession {
  plugin_key: string;
  token: string;
  expires_in_seconds: number;
  entry: string;
}
