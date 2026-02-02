import { TestBed } from '@angular/core/testing';
import { CountryService } from './country-service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('CountryService', () => {
  let service: CountryService;
  let httpMock: HttpTestingController;

  const mockCountries = [
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CountryService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CountryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllCountries', () => {
    it('should return all countries', (done) => {
      service.getAllCountries().subscribe((countries) => {
        expect(countries.length).toBe(3);
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockCountries);
    });

    it('should return countries with code, name, and flag', (done) => {
      service.getAllCountries().subscribe((countries) => {
        const firstCountry = countries[0];
        expect(firstCountry).toHaveProperty('code');
        expect(firstCountry).toHaveProperty('name');
        expect(firstCountry).toHaveProperty('flag');
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });

    it('should include Vietnam', (done) => {
      service.getAllCountries().subscribe((countries) => {
        const vietnam = countries.find((c) => c.code === 'VN');
        expect(vietnam).toBeDefined();
        expect(vietnam?.name).toBe('Vietnam');
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });

    it('should cache countries after first load', (done) => {
      service.getAllCountries().subscribe(() => {
        // Second call should use cached data
        service.getAllCountries().subscribe((countries) => {
          expect(countries.length).toBe(3);
          done();
        });
      });

      // Only one HTTP request should be made
      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });
  });

  describe('searchCountries', () => {
    it('should return all countries when query is empty', (done) => {
      service.searchCountries('').subscribe((searchResults) => {
        expect(searchResults.length).toBe(3);
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });

    it('should filter countries by name', (done) => {
      service.searchCountries('Vietnam').subscribe((results) => {
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Vietnam');
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });

    it('should filter countries by code', (done) => {
      service.searchCountries('VN').subscribe((results) => {
        expect(results.length).toBe(1);
        expect(results[0].code).toBe('VN');
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });

    it('should be case insensitive', (done) => {
      service.searchCountries('vietnam').subscribe((results) => {
        expect(results.length).toBe(1);
        expect(results[0].name).toBe('Vietnam');
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });

    it('should return multiple matches for partial queries', (done) => {
      service.searchCountries('United').subscribe((results) => {
        expect(results.length).toBe(2);
        expect(results.some((c) => c.name === 'United States')).toBe(true);
        expect(results.some((c) => c.name === 'United Kingdom')).toBe(true);
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });
  });

  describe('getCountryByCode', () => {
    it('should return country for valid code', (done) => {
      service.getCountryByCode('VN').subscribe((country) => {
        expect(country).toBeDefined();
        expect(country?.name).toBe('Vietnam');
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });

    it('should return undefined for invalid code', (done) => {
      service.getCountryByCode('XX').subscribe((country) => {
        expect(country).toBeUndefined();
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });
  });

  describe('isValidCountryCode', () => {
    it('should return true for valid codes', (done) => {
      service.isValidCountryCode('VN').subscribe((isValid) => {
        expect(isValid).toBe(true);
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });

    it('should return false for invalid codes', (done) => {
      service.isValidCountryCode('XX').subscribe((isValid) => {
        expect(isValid).toBe(false);
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.flush(mockCountries);
    });
  });

  describe('error handling', () => {
    it('should return empty array on HTTP error', (done) => {
      service.getAllCountries().subscribe((countries) => {
        expect(countries).toEqual([]);
        done();
      });

      const req = httpMock.expectOne('/data/common/countries.json');
      req.error(new ProgressEvent('error'));
    });
  });
});
    });

    it('should filter countries by code', () => {
      const results = service.searchCountries('VN');
      expect(results.length).toBe(1);
      expect(results[0].code).toBe('VN');
    });

    it('should be case insensitive', () => {
      const results = service.searchCountries('vietnam');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Vietnam');
    });

    it('should return multiple matches for partial queries', () => {
      const results = service.searchCountries('United');
      expect(results.length).toBeGreaterThan(1);
      expect(results.some((c) => c.name === 'United States')).toBe(true);
      expect(results.some((c) => c.name === 'United Kingdom')).toBe(true);
      expect(results.some((c) => c.name === 'United Arab Emirates')).toBe(true);
    });
  });

  describe('getCountryByCode', () => {
    it('should return country for valid code', () => {
      const country = service.getCountryByCode('VN');
      expect(country).toBeDefined();
      expect(country?.name).toBe('Vietnam');
    });

    it('should return undefined for invalid code', () => {
      const country = service.getCountryByCode('XX');
      expect(country).toBeUndefined();
    });
  });

  describe('isValidCountryCode', () => {
    it('should return true for valid codes', () => {
      expect(service.isValidCountryCode('VN')).toBe(true);
      expect(service.isValidCountryCode('US')).toBe(true);
      expect(service.isValidCountryCode('GB')).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(service.isValidCountryCode('XX')).toBe(false);
      expect(service.isValidCountryCode('ZZ')).toBe(false);
    });
  });
});
