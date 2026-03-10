import { isDevMode } from '@angular/core';

/**
 * Returns true when the Angular application is running in development mode.
 * Uses Angular's built-in `isDevMode()` so it is consistent with the rest of the app.
 */
export const isDev: boolean = isDevMode();
