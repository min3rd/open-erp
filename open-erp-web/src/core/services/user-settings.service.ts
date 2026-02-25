import { Injectable, signal } from '@angular/core';
import type { MeSettings } from '../../app/private/me/me.types';

export interface DateTimeConfig {
  /** Format string: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' */
  dateFormat: string;
  /** Time format: 'HH:mm' (24h) | 'hh:mm A' (12h) */
  timeFormat: string;
  /** IANA timezone identifier, e.g. 'Asia/Ho_Chi_Minh' */
  timezone: string;
  /** BCP 47 locale tag, e.g. 'vi', 'en' */
  locale: string;
}

export const DEFAULT_DATE_TIME_CONFIG: DateTimeConfig = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale: 'vi',
};

const STORAGE_KEY = 'app.dateTimeConfig';

/**
 * Service that caches the user's date/time display preferences.
 * Loads from localStorage on startup; updated when the user saves settings.
 * Used by {@link UserDatePipe} to format dates consistently across the app.
 */
@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private readonly _config = signal<DateTimeConfig>(this.loadFromStorage());

  /** Read-only signal exposing the current date/time config. */
  readonly config = this._config.asReadonly();

  /**
   * Applies the relevant date/time fields from a {@link MeSettings} object
   * and persists them to localStorage.
   */
  applyFromMeSettings(settings: Partial<MeSettings>): void {
    const current = this._config();
    const updated: DateTimeConfig = {
      dateFormat: settings.dateFormat ?? current.dateFormat,
      timeFormat: settings.timeFormat ?? current.timeFormat,
      timezone: settings.timezone ?? current.timezone,
      locale: settings.locale ?? settings.language ?? current.locale,
    };
    this._config.set(updated);
    this.persist(updated);
  }

  private loadFromStorage(): DateTimeConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_DATE_TIME_CONFIG, ...JSON.parse(raw) };
      }
    } catch {
      // ignore – fall through to default
    }
    return { ...DEFAULT_DATE_TIME_CONFIG };
  }

  private persist(config: DateTimeConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }
}
