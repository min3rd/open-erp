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
    const [y, m, d] = raw.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    return Number.isNaN(localDate.getTime()) ? null : localDate;
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
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

/** Short date only in the user's locale and machine timezone. */
export function formatDate(value: DateValue, locale?: string): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

/** Medium time only in the user's locale and machine timezone. */
export function formatTime(value: DateValue, locale?: string): string {
  const date = toDate(value);
  if (!date) {
    return EMPTY_PLACEHOLDER;
  }
  return new Intl.DateTimeFormat(resolveLocale(locale), { timeStyle: 'medium' }).format(date);
}
