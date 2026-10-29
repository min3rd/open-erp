import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Legacy `/apps/*` URLs used by the first plugin host. Plugin screens now live
 * inside the core settings layout; keep old bookmarks working.
 */
export const legacyPluginRedirectGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return router.parseUrl(state.url.replace(/^\/apps\//, '/settings/apps/'));
};
