import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NavigationList } from './list/list';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NavigationManagementService } from './services/navigation-management.service';
import { MessageService } from 'primeng/api';
import { API_URI_CONFIG } from '../../../../../core/constant';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('NavigationList', () => {
  let component: NavigationList;
  let fixture: ComponentFixture<NavigationList>;
  let httpMock: HttpTestingController;
  const baseUrl = `${API_URI_CONFIG}/v1/navigations`;

  const mockGlobalNavigationItems = [
    {
      id: 'nav-1',
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
      scope: 'global' as const,
      order: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'nav-2',
      label: 'Users',
      icon: 'pi pi-users',
      routerLink: '/users',
      scope: 'global' as const,
      moduleKey: 'user-management',
      order: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NavigationList,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        NavigationManagementService,
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationList);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load global navigation on init', () => {
    // Set up cache to return items
    const service = TestBed.inject(NavigationManagementService);
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    expect(req.request.method).toBe('GET');
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    fixture.detectChanges();

    expect(component['globalNavigationItems']().length).toBe(2);
    expect(component['globalNavigationItems']()[0].label).toBe('Dashboard');
  });

  it('should have required DOM elements with unique IDs', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#navigation-list-toolbar')).toBeTruthy();
    expect(compiled.querySelector('#navigation-list-add-button')).toBeTruthy();
    expect(compiled.querySelector('#navigation-list-refresh-button')).toBeTruthy();
    expect(compiled.querySelector('#navigation-list-edit-button')).toBeTruthy();
    expect(compiled.querySelector('#navigation-list-delete-button')).toBeTruthy();
    expect(compiled.querySelector('#navigation-list-content')).toBeTruthy();
    expect(compiled.querySelector('#navigation-list-status')).toBeTruthy();
  });

  it('should show loading state', () => {
    component['isLoading'].set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusRegion = compiled.querySelector('#navigation-list-status');
    expect(statusRegion?.textContent).toContain('Loading');

    // Complete the request
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: [], scope: 'global', total: 0 });
  });

  it('should display desktop two-pane layout', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    component['isMobile'].set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#navigation-list-global-pane')).toBeTruthy();
    expect(compiled.querySelector('#navigation-list-module-pane')).toBeTruthy();
    expect(compiled.querySelector('#navigation-list-global-tree')).toBeTruthy();
  });

  it('should display mobile single-column layout with tabs', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    component['isMobile'].set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#navigation-list-scope-selector')).toBeTruthy();
    expect(compiled.querySelector('#navigation-list-global-tree-mobile')).toBeTruthy();
  });

  it('should convert navigation items to tree nodes', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    expect(component['globalTreeNodes']().length).toBe(2);
    expect(component['globalTreeNodes']()[0].label).toBe('Dashboard');
    expect(component['globalTreeNodes']()[0].data.id).toBe('nav-1');
  });

  it('should handle node selection', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    const mockEvent = {
      node: {
        key: 'nav-1',
        label: 'Dashboard',
        data: mockGlobalNavigationItems[0],
      },
    };

    component['onNodeSelect'](mockEvent);

    expect(component['selectedItem']()).toEqual(mockGlobalNavigationItems[0]);
    expect(component['selectedTreeNode']()).toEqual(mockEvent.node);
  });

  it('should load module navigation when module item is selected', () => {
    const req1 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req1.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    const moduleItem = mockGlobalNavigationItems[1];
    const mockEvent = {
      node: {
        key: moduleItem.id,
        label: moduleItem.label,
        data: moduleItem,
      },
    };

    component['activeScope'].set('global');
    component['onNodeSelect'](mockEvent);

    const req2 = httpMock.expectOne(`${baseUrl}/module/${moduleItem.moduleKey}?includeHidden=true`);
    expect(req2.request.method).toBe('GET');
    req2.flush({ items: [], scope: 'module', total: 0 });

    expect(component['selectedModule']()).toEqual(moduleItem);
  });

  it('should delete navigation item', () => {
    const req1 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req1.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    component['selectedItem'].set(mockGlobalNavigationItems[0]);

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component['onDeleteItem']();

    const req2 = httpMock.expectOne(`${baseUrl}/nav-1`);
    expect(req2.request.method).toBe('DELETE');
    req2.flush(null);

    // Expect reload
    const req3 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req3.flush({ items: [], scope: 'global', total: 0 });

    expect(component['selectedItem']()).toBeNull();
  });

  it('should not delete when user cancels confirmation', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    component['selectedItem'].set(mockGlobalNavigationItems[0]);

    // Mock window.confirm to return false
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component['onDeleteItem']();

    // No DELETE request should be made
    httpMock.expectNone(`${baseUrl}/nav-1`);
  });

  it('should refresh current navigation', () => {
    const req1 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req1.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    component['activeScope'].set('global');
    component['onRefresh']();

    const req2 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    expect(req2.request.method).toBe('GET');
    req2.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });
  });

  it('should have proper aria-live region for status announcements', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusRegion = compiled.querySelector('#navigation-list-status');

    expect(statusRegion).toBeTruthy();
    expect(statusRegion?.getAttribute('role')).toBe('status');
    expect(statusRegion?.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion?.getAttribute('aria-atomic')).toBe('true');
  });

  it('should disable edit and delete buttons when no item is selected', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const editButton = compiled.querySelector(
      '#navigation-list-edit-button button',
    ) as HTMLButtonElement;
    const deleteButton = compiled.querySelector(
      '#navigation-list-delete-button button',
    ) as HTMLButtonElement;

    expect(editButton?.disabled).toBe(true);
    expect(deleteButton?.disabled).toBe(true);
  });

  it('should enable edit and delete buttons when item is selected', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    component['selectedItem'].set(mockGlobalNavigationItems[0]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const editButton = compiled.querySelector(
      '#navigation-list-edit-button button',
    ) as HTMLButtonElement;
    const deleteButton = compiled.querySelector(
      '#navigation-list-delete-button button',
    ) as HTMLButtonElement;

    expect(editButton?.disabled).toBe(false);
    expect(deleteButton?.disabled).toBe(false);
  });

  it('should enable move up/down buttons for keyboard accessibility', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ items: mockGlobalNavigationItems, scope: 'global', total: 2 });

    component['selectedItem'].set(mockGlobalNavigationItems[0]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const moveUpButton = compiled.querySelector('#navigation-list-move-up-button') as HTMLElement;
    const moveDownButton = compiled.querySelector(
      '#navigation-list-move-down-button',
    ) as HTMLElement;

    expect(moveUpButton).toBeTruthy();
    expect(moveDownButton).toBeTruthy();
  });
});
