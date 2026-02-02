import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface LanguageOption {
  code: string;
  label: string;
  flagCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private http = inject(HttpClient);
  private languages$: Observable<LanguageOption[]> | null = null;

  loadLanguages(): Observable<LanguageOption[]> {
    if (!this.languages$) {
      this.languages$ = this.http
        .get<LanguageOption[]>('/data/common/languages.json')
        .pipe(shareReplay(1));
    }
    return this.languages$;
  }
}
