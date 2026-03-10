import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth-service';

// Build a minimal non-expired JWT with the given payload for testing
function makeJwt(payload: object = {}): string {
  return (
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, ...payload })).replace(
      /=/g,
      '',
    ) +
    '.sig'
  );
}

// Minimal non-expired JWT for testing
const VALID_TOKEN = makeJwt();
const REFRESH_TOKEN = 'a'.repeat(64);
const NEW_ACCESS_TOKEN = makeJwt({ new: true });

function buildAuthServiceMock(overrides: Partial<AuthService> = {}): Partial<AuthService> {
  return {
    accessToken: VALID_TOKEN,
    refreshToken: REFRESH_TOKEN,
    isExpired: () => false,
    logOut: () => of(true),
    refreshAccessToken: () => of(NEW_ACCESS_TOKEN),
    ...overrides,
  };
}

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let router: Router;
  let authService: AuthService;

  function setup(authMock: Partial<AuthService> = buildAuthServiceMock()) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  }

  afterEach(() => {
    httpMock.verify();
    // Reset module-level refresh state between tests by forcing a new module
    TestBed.resetTestingModule();
  });

  it('should attach Authorization header when access token is valid', () => {
    setup();
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${VALID_TOKEN}`);
    req.flush({});
  });

  it('should not attach Authorization header when no access token', () => {
    setup(buildAuthServiceMock({ accessToken: undefined }));
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not attach Authorization header when token is expired', () => {
    setup(buildAuthServiceMock({ isExpired: () => true }));
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should pass through non-401 errors unchanged', () => {
    setup();
    let errorStatus = 0;
    http.get('/api/test').subscribe({ error: (e) => (errorStatus = e.status) });
    const req = httpMock.expectOne('/api/test');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    expect(errorStatus).toBe(500);
  });

  it('should pass through 401 without refresh when no refresh token', () => {
    setup(buildAuthServiceMock({ refreshToken: undefined }));
    spyOn(router, 'navigate');
    let errorStatus = 0;
    http.get('/api/test').subscribe({ error: (e) => (errorStatus = e.status) });
    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(errorStatus).toBe(401);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should call refreshAccessToken and retry request on 401', () => {
    const refreshSpy = jasmine
      .createSpy('refreshAccessToken')
      .and.returnValue(of(NEW_ACCESS_TOKEN));
    setup(buildAuthServiceMock({ refreshAccessToken: refreshSpy }));

    let responseData: any;
    http.get('/api/protected').subscribe((data) => (responseData = data));

    // First request returns 401
    const firstReq = httpMock.expectOne('/api/protected');
    expect(firstReq.request.headers.get('Authorization')).toBe(`Bearer ${VALID_TOKEN}`);
    firstReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Interceptor should retry with new token
    const retryReq = httpMock.expectOne('/api/protected');
    expect(retryReq.request.headers.get('Authorization')).toBe(`Bearer ${NEW_ACCESS_TOKEN}`);
    expect(retryReq.request.headers.get('X-Retry-Attempted')).toBe('1');
    retryReq.flush({ result: 'ok' });

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(responseData).toEqual({ result: 'ok' });
  });

  it('should logout and navigate to login when refresh fails', () => {
    const logoutSpy = jasmine.createSpy('logOut').and.returnValue(of(true));
    const refreshSpy = jasmine
      .createSpy('refreshAccessToken')
      .and.returnValue(throwError(() => new Error('refresh failed')));
    setup(buildAuthServiceMock({ logOut: logoutSpy, refreshAccessToken: refreshSpy }));
    spyOn(router, 'navigate');

    let errorCaught = false;
    http.get('/api/protected').subscribe({ error: () => (errorCaught = true) });

    const req = httpMock.expectOne('/api/protected');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(logoutSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(errorCaught).toBe(true);
  });

  it('should logout when retry after refresh still returns 401', () => {
    const logoutSpy = jasmine.createSpy('logOut').and.returnValue(of(true));
    setup(buildAuthServiceMock({ logOut: logoutSpy }));
    spyOn(router, 'navigate');

    let errorCaught = false;
    http.get('/api/protected').subscribe({ error: () => (errorCaught = true) });

    // First request returns 401
    const firstReq = httpMock.expectOne('/api/protected');
    firstReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Retry also returns 401 — interceptor must not loop
    const retryReq = httpMock.expectOne('/api/protected');
    expect(retryReq.request.headers.get('X-Retry-Attempted')).toBe('1');
    retryReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(errorCaught).toBe(true);
  });
});
