import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

/**
 * Geocoding result from Nominatim API
 */
export interface GeocodingResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: string[];
  type?: string;
  importance?: number;
}

/**
 * Geocoding service using OpenStreetMap Nominatim API
 */
@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private readonly http = inject(HttpClient);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  /**
   * Search for locations using Nominatim API
   * @param query Search query (e.g., address, place name)
   * @param limit Maximum number of results (default: 5)
   * @returns Observable of geocoding results
   */
  searchLocation(query: string, limit: number = 5): Observable<GeocodingResult[]> {
    if (!query || query.trim().length < 3) {
      return of([]);
    }

    const params = {
      q: query.trim(),
      format: 'jsonv2',
      limit: limit.toString(),
      addressdetails: '1',
      'accept-language': 'vi,en',
    };

    return this.http
      .get<GeocodingResult[]>(this.nominatimUrl, {
        params,
        headers: {
          'User-Agent': 'OpenERP-Warehouse-Management/1.0',
        },
      })
      .pipe(
        map((results) => results || []),
        catchError((error) => {
          console.error('Geocoding search failed:', error);
          return of([]);
        }),
      );
  }

  /**
   * Format a geocoding result for display
   */
  formatDisplayName(result: GeocodingResult): string {
    return result.display_name;
  }

  /**
   * Get coordinates from a geocoding result
   */
  getCoordinates(result: GeocodingResult): { lat: number; lng: number } {
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  }
}
