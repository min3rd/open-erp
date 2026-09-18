import { ApiErrorResponse } from '../models/api.model';

export interface ApiMessageTranslator {
  t(code: string, params?: Record<string, any>): string;
}

export function apiMessage(i18n: ApiMessageTranslator, err?: ApiErrorResponse | null): string {
  const fieldError = err?.errors?.[0];
  if (fieldError?.code) {
    return i18n.t(fieldError.code, fieldError.params);
  }
  if (err?.code) {
    return i18n.t(err.code, err.params);
  }
  return i18n.t('INTERNAL_SERVER_ERROR');
}
