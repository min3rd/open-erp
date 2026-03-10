import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { List } from './list';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { UserService } from '../../../../../../core/services/user-service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { signal } from '@angular/core';
import { API_URI_USER } from '../../../../../../core/constant';

describe('List', () => {
  let component: List;
  let fixture: ComponentFixture<List>;
  let httpMock: HttpTestingController;
  let organizationContext: Partial<OrganizationContextService>;

  beforeEach(async () => {
    organizationContext = {
      currentOrganization: signal(null),
      organizationChanged$: new Subject(),
    };

    await TestBed.configureTestingModule({
      imports: [
        List,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        provideRouter([
          {
            path: 'management/user/:filter/:page/:limit',
            component: List,
          },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        UserService,
        { provide: OrganizationContextService, useValue: organizationContext },
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(List);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    const req = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    req.flush({ data: [], total: 0, page: 1, limit: 10 });
    expect(component).toBeTruthy();
  });

  it('should load users on initialization', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], total: 0, page: 1, limit: 10 });
  });

  it('should have all required DOM elements with correct IDs', () => {
    const req = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    req.flush({ data: [], total: 0, page: 1, limit: 10 });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#user-list-toolbar')).toBeTruthy();
    expect(compiled.querySelector('#user-list-scope-toggle')).toBeTruthy();
    expect(compiled.querySelector('#user-list-search')).toBeTruthy();
    expect(compiled.querySelector('#user-list-add-button')).toBeTruthy();
    expect(compiled.querySelector('#user-list-actions-button')).toBeTruthy();
    expect(compiled.querySelector('#user-list-content')).toBeTruthy();
    expect(compiled.querySelector('#user-list-table')).toBeTruthy();
    expect(compiled.querySelector('#user-list-pagination')).toBeTruthy();
    expect(compiled.querySelector('#user-list-status')).toBeTruthy();
  });

  it('should filter users when search query changes', async () => {
    fixture.detectChanges();
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    const searchInput = fixture.nativeElement.querySelector(
      '#user-list-search',
    ) as HTMLInputElement;
    searchInput.value = 'User One';
    searchInput.dispatchEvent(new Event('input'));

    // Wait for route navigation
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('should export to CSV when download action is triggered', () => {
    fixture.detectChanges();
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    component['onDownloadCSV']();

    const exportReq = httpMock.expectOne(`${API_URI_USER}/v1/users/export`);
    expect(exportReq.request.method).toBe('POST');
    exportReq.flush(new Blob(['test'], { type: 'text/csv' }));
  });

  it('should block selected users', () => {
    fixture.detectChanges();
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    const mockUsers = [
      {
        id: 'user-1',
        username: 'user1',
        email: 'user1@example.com',
        fullName: 'User One',
        status: 'active' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'user-2',
        username: 'user2',
        email: 'user2@example.com',
        fullName: 'User Two',
        status: 'active' as const,
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ];
    initialReq.flush({ data: mockUsers, total: 2, page: 1, limit: 10 });

    component['selectedUsers'].set(mockUsers);
    component['onBlockSelected']();

    const blockReq = httpMock.expectOne(`${API_URI_USER}/v1/users/block`);
    expect(blockReq.request.method).toBe('POST');
    expect(blockReq.request.body).toEqual({ userIds: ['user-1', 'user-2'] });
    blockReq.flush(null);

    // Expect reload
    const reloadReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    reloadReq.flush({ data: [], total: 0, page: 1, limit: 10 });
  });

  it('should revoke login sessions for selected users', () => {
    fixture.detectChanges();
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    const mockUser = {
      id: 'user-1',
      username: 'user1',
      email: 'user1@example.com',
      fullName: 'User One',
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    initialReq.flush({ data: [mockUser], total: 1, page: 1, limit: 10 });

    component['selectedUsers'].set([mockUser]);
    component['onRevokeLoginSessions']();

    const revokeReq = httpMock.expectOne(`${API_URI_USER}/v1/users/revoke-sessions`);
    expect(revokeReq.request.method).toBe('POST');
    expect(revokeReq.request.body).toEqual({ userIds: ['user-1'] });
    revokeReq.flush(null);
  });

  it('should format dates correctly', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    const dateString = '2024-01-01T00:00:00.000Z';
    const formatted = component['formatDate'](dateString);
    expect(formatted).toBeTruthy();
    expect(formatted).not.toBe('Never');

    const emptyFormatted = component['formatDate']('');
    expect(emptyFormatted).toBe('Never');
  });

  it('should return correct status severity', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    expect(component['getStatusSeverity']('active')).toBe('success');
    expect(component['getStatusSeverity']('inactive')).toBe('warn');
    expect(component['getStatusSeverity']('blocked')).toBe('danger');
    expect(component['getStatusSeverity']('unknown')).toBe('secondary');
  });

  it('should have proper aria-live region for status announcements', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusRegion = compiled.querySelector('#user-list-status');

    expect(statusRegion).toBeTruthy();
    expect(statusRegion?.getAttribute('role')).toBe('status');
    expect(statusRegion?.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion?.getAttribute('aria-atomic')).toBe('true');
  });

  it('should detect mobile viewport correctly', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    // Default is desktop (window width >= 768)
    expect(component['isMobile']()).toBe(false);

    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    component['checkViewport']();
    fixture.detectChanges();

    expect(component['isMobile']()).toBe(true);
  });

  it('should show mobile toolbar when in mobile view', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    // Set mobile viewport
    component['isMobile'].set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#user-list-toolbar-mobile')).toBeTruthy();
    expect(compiled.querySelector('#user-list-search-button-mobile')).toBeTruthy();
  });

  it('should toggle search input on mobile', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    component['isMobile'].set(true);
    expect(component['isSearchOpen']()).toBe(false);

    component['toggleSearch']();
    expect(component['isSearchOpen']()).toBe(true);

    component['toggleSearch']();
    expect(component['isSearchOpen']()).toBe(false);
  });

  it('should close search and clear query on mobile', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    component['isMobile'].set(true);
    component['isSearchOpen'].set(true);
    component['searchQuery'].set('test query');

    component['closeSearch']();

    expect(component['isSearchOpen']()).toBe(false);
    expect(component['searchQuery']()).toBe('');
  });

  it('should render mobile list view when in mobile mode', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    component['isMobile'].set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#user-list-mobile')).toBeTruthy();
    expect(compiled.querySelector('#user-list-table')).toBeFalsy();
  });

  it('should render shared pagination controls', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#user-list-pagination')).toBeTruthy();
    expect(compiled.querySelector('#user-list-pagination-first-button')).toBeTruthy();
    expect(compiled.querySelector('#user-list-pagination-prev-button')).toBeTruthy();
    expect(compiled.querySelector('#user-list-pagination-next-button')).toBeTruthy();
    expect(compiled.querySelector('#user-list-pagination-last-button')).toBeTruthy();
    expect(compiled.querySelector('#user-list-pagination-page-size')).toBeTruthy();
  });

  it('should get user initials correctly', () => {
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    const user = {
      id: 'user-1',
      username: 'user1',
      email: 'user1@example.com',
      fullName: 'User One',
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const initials = component['getUserInitials'](user);
    expect(initials).toBe('UO'); // "User One" -> "UO"
  });

  it('should refresh users when refresh button clicked', () => {
    fixture.detectChanges();
    const initialReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    initialReq.flush({ data: [], total: 0, page: 1, limit: 10 });

    component['onRefresh']();

    const refreshReq = httpMock.expectOne((req) => req.url.includes(`${API_URI_USER}/v1/users`));
    expect(refreshReq.request.method).toBe('GET');
    refreshReq.flush({ data: [], total: 0, page: 1, limit: 10 });
  });
});
