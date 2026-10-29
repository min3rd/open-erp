import { Injectable, signal } from '@angular/core';
import { CatalogScope } from './services/catalog-admin.service';

/**
 * Runtime values supplied by the core host when it mounts the catalog web
 * component (scope/readonly). The plugin never reads host URL/query directly.
 */
@Injectable({ providedIn: 'root' })
export class CatalogRuntimeService {
  readonly scope = signal<CatalogScope>(CatalogScope.TENANT);
  readonly readOnly = signal(false);
  /** View mode parsed from the host route (`list`, `tree`, `multi`). */
  readonly viewMode = signal('');
  /** Empty when the host proxies `/api` on the same origin. */
  readonly apiBaseUrl = signal('');
}
