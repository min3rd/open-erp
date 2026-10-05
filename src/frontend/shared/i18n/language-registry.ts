import { LangCode } from '../enums/lang.enum';

export type TextDirection = 'ltr' | 'rtl';

export interface LanguageInfo {
  code: LangCode;
  /** Endonym shown in the switcher (never translated). */
  nativeName: string;
  dir: TextDirection;
  /** True once the locale dictionary is complete enough to be selectable. */
  released: boolean;
}

/**
 * Language registry (Sprint 04, FEAT-29). `released` gates the switcher: a
 * locale only becomes selectable when its dictionary reaches 100% key parity
 * with `en` (customer decision), so a partially translated locale never ships.
 */
export const LANGUAGES: readonly LanguageInfo[] = [
  { code: LangCode.VI, nativeName: 'Tiếng Việt', dir: 'ltr', released: true },
  { code: LangCode.EN, nativeName: 'English', dir: 'ltr', released: true },
  { code: LangCode.ZH_CN, nativeName: '简体中文', dir: 'ltr', released: true },
  { code: LangCode.JA, nativeName: '日本語', dir: 'ltr', released: true },
  { code: LangCode.KO, nativeName: '한국어', dir: 'ltr', released: true },
  { code: LangCode.ES, nativeName: 'Español', dir: 'ltr', released: true },
  { code: LangCode.FR, nativeName: 'Français', dir: 'ltr', released: true },
  { code: LangCode.DE, nativeName: 'Deutsch', dir: 'ltr', released: true },
  { code: LangCode.PT_BR, nativeName: 'Português (BR)', dir: 'ltr', released: true },
  { code: LangCode.RU, nativeName: 'Русский', dir: 'ltr', released: true },
  { code: LangCode.AR, nativeName: 'العربية', dir: 'rtl', released: true },
  { code: LangCode.TH, nativeName: 'ไทย', dir: 'ltr', released: false },
  { code: LangCode.ID, nativeName: 'Bahasa Indonesia', dir: 'ltr', released: false }
];

export const DEFAULT_LANG: LangCode = LangCode.VI;
export const FALLBACK_LANG: LangCode = LangCode.EN;

export function releasedLanguages(): readonly LanguageInfo[] {
  return LANGUAGES.filter((language) => language.released);
}

export function findLanguage(code: string | null | undefined): LanguageInfo | null {
  if (!code) {
    return null;
  }
  return LANGUAGES.find((language) => language.code === code) ?? null;
}

export function isLangCode(value: unknown): value is LangCode {
  return typeof value === 'string' && LANGUAGES.some((language) => language.code === value);
}
