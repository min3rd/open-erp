export type DateValue = string | number | Date | null | undefined;

const EMPTY_PLACEHOLDER = '—';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;

function resolveLocale(locale?: string): string {
  if (locale) {
    return locale;
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'vi-VN';
}

/**
 * Parses backend timestamps. DB stores UTC; if the payload lacks a timezone
 * suffix (e.g. "2026-09-19T08:30:00") it is treated as UTC instead of local time.
 */
function toDate(value: DateValue): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }

  let raw = String(value).trim();
  if (!raw) {
    return null;
  }
  if (DATE_ONLY_PATTERN.test(raw)) {
    raw = `${raw}T00:00:00Z`;
  } else {
    raw = raw.replace(' ', 'T');
    if (!TIMEZONE_SUFFIX_PATTERN.test(raw)) {
      raw = `${raw}Z`;
    }
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Short date + short time in the user's locale and machine timezone. */
export function formatDateTime(value: DateValue, locale?: string): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return new Intl.DateTimeFormat(resolveLocale(locale), { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

/** Short date only in the user's locale and machine timezone. */
export function formatDate(value: DateValue, locale?: string): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return new Intl.DateTimeFormat(resolveLocale(locale), { dateStyle: 'short' }).format(date);
}

/** Medium time only in the user's locale and machine timezone. */
export function formatTime(value: DateValue, locale?: string): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return new Intl.DateTimeFormat(resolveLocale(locale), { timeStyle: 'medium' }).format(date);
}

/** Relative time (e.g. "3 minutes ago") in the user's locale. */
export function formatRelative(value: DateValue, locale?: string): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  const formatter = new Intl.RelativeTimeFormat(resolveLocale(locale), { numeric: 'auto' });
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
  ];
  for (const [unit, seconds] of units) {
    const amount = diffSeconds / seconds;
    if (Math.abs(amount) >= 1 || unit === 'second') {
      return formatter.format(Math.round(amount), unit);
    }
  }
  return formatter.format(diffSeconds, 'second');
}
