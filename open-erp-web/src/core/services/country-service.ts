import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, shareReplay } from 'rxjs';

export interface Country {
  code: string;
  name: string;
  flag?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  private httpClient = inject(HttpClient);
  private countries$: Observable<Country[]> | null = null;

  /**
   * Load countries from JSON file
   */
  private loadCountries(): Observable<Country[]> {
    if (!this.countries$) {
      this.countries$ = this.httpClient.get<Country[]>('/data/common/countries.json').pipe(
        catchError((error) => {
          console.error('Failed to load countries:', error);
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.countries$;
  }

  /**
   * Get all countries
   */
  getAllCountries(): Observable<Country[]> {
    return this.loadCountries();
  }

  /**
   * Search countries by name or code
   */
  searchCountries(query: string): Observable<Country[]> {
    return this.loadCountries().pipe(
      map((countries) => {
        if (!query || query.trim() === '') {
          return countries;
        }

        const searchTerm = query.toLowerCase().trim();
        return countries.filter(
          (country) =>
            country.name.toLowerCase().includes(searchTerm) ||
            country.code.toLowerCase().includes(searchTerm)
        );
      })
    );
  }

  /**
   * Get country by code
   */
  getCountryByCode(code: string): Observable<Country | undefined> {
    return this.loadCountries().pipe(
      map((countries) => countries.find((country) => country.code === code))
    );
  }

  /**
   * Validate if a country code exists
   */
  isValidCountryCode(code: string): Observable<boolean> {
    return this.loadCountries().pipe(
      map((countries) => countries.some((country) => country.code === code))
    );
  }
}
