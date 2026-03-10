import { Pipe, PipeTransform, inject } from '@angular/core';
import { UserSettingsService } from '../services/user-settings.service';

export type UserDateMode = 'date' | 'time' | 'datetime' | 'short' | 'relative';

/**
 * Formats a date/time value according to the current user's display preferences
 * (dateFormat, timeFormat, timezone, locale) stored in {@link UserSettingsService}.
 *
 * Usage in templates:
 *   {{ item.createdAt | userDate }}           → date only
 *   {{ item.createdAt | userDate:'datetime' }} → date + time
 *   {{ item.createdAt | userDate:'time' }}     → time only
 *   {{ item.createdAt | userDate:'relative' }} → relative ("2h", "3d", …)
 *
 * Returns '-' for null/undefined/invalid inputs.
 *
 * The pipe is intentionally impure so it re-evaluates when the user updates
 * their settings (the underlying signal changes).
 */
@Pipe({
  name: 'userDate',
  standalone: true,
  pure: false,
})
export class UserDatePipe implements PipeTransform {
  private readonly userSettings = inject(UserSettingsService);

  transform(value: string | Date | null | undefined, mode: UserDateMode = 'date'): string {
    if (value == null || value === '') return '-';

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '-';

    const cfg = this.userSettings.config();
    const timezone = this.safeTimezone(cfg.timezone);
    const locale = cfg.locale || 'vi';

    switch (mode) {
      case 'relative':
        return this.formatRelative(date, cfg.dateFormat, timezone, locale);
      case 'time':
        return this.formatTime(date, cfg.timeFormat, timezone, locale);
      case 'date':
      case 'short':
        return this.formatDate(date, cfg.dateFormat, timezone, locale);
      case 'datetime':
      default:
        return (
          this.formatDate(date, cfg.dateFormat, timezone, locale) +
          ' ' +
          this.formatTime(date, cfg.timeFormat, timezone, locale)
        );
    }
  }

  private formatDate(date: Date, formatStr: string, timezone: string, locale: string): string {
    try {
      const parts = new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);

      const map: Record<string, string> = {};
      for (const part of parts) {
        map[part.type] = part.value;
      }

      return (formatStr || 'DD/MM/YYYY')
        .replace('YYYY', map['year'] ?? '')
        .replace('MM', map['month'] ?? '')
        .replace('DD', map['day'] ?? '');
    } catch {
      return date.toLocaleDateString();
    }
  }

  private formatTime(date: Date, timeFormat: string, timezone: string, locale: string): string {
    try {
      const is12h = (timeFormat ?? '').includes('A');
      const parts = new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: is12h,
      }).formatToParts(date);

      const map: Record<string, string> = {};
      for (const part of parts) {
        map[part.type] = part.value;
      }

      if (is12h) {
        const period = map['dayPeriod'] ?? '';
        return `${map['hour']}:${map['minute']} ${period}`.trim();
      }
      return `${map['hour']}:${map['minute']}`;
    } catch {
      return date.toLocaleTimeString();
    }
  }

  private formatRelative(date: Date, dateFormat: string, timezone: string, locale: string): string {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return this.formatDate(date, dateFormat, timezone, locale);
  }

  private safeTimezone(tz: string): string {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return tz;
    } catch {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }
}
