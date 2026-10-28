import { InjectionToken } from '@angular/core';

/**
 * Mobile (and any read-only host) renders the catalog screen without write
 * actions. The host passes `readonly=1` when the manifest screen says read_only.
 */
export const CATALOG_READ_ONLY = new InjectionToken<boolean>('CATALOG_READ_ONLY');
