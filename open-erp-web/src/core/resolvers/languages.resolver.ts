import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { LanguageService, LanguageOption } from '../services/language.service';

export const languagesResolver: ResolveFn<LanguageOption[]> = () => {
  return inject(LanguageService).loadLanguages();
};
