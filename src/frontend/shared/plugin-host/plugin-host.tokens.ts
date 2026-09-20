import { InjectionToken } from '@angular/core';

export type PluginPermissionChecker = (permission?: string) => boolean;

export const PLUGIN_PERMISSION_CHECKER = new InjectionToken<PluginPermissionChecker>(
  'PLUGIN_PERMISSION_CHECKER',
  { providedIn: 'root', factory: () => () => true }
);
