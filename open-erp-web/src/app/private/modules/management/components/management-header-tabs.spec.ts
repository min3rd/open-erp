import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ManagementHeaderTabs } from './management-header-tabs';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NavigationService } from '../../../../../core/services/navigation-service';
import { of } from 'rxjs';
import { MenuItem } from 'primeng/api';

describe('ManagementHeaderTabs', () => {
  let component: ManagementHeaderTabs;
  let fixture: ComponentFixture<ManagementHeaderTabs>;
  let navigationService: jasmine.SpyObj<NavigationService>;

  const mockNavigationItems: MenuItem[] = [
    {
      id: 'user',
      label: 'User Management',
      icon: 'pi pi-users',
      routerLink: ['user'],
    },
    {
      id: 'product',
      label: 'Product Management',
      icon: 'pi pi-box',
      routerLink: ['product'],
    },
  ];

  beforeEach(async () => {
    const navigationServiceSpy = jasmine.createSpyObj('NavigationService', [
      'getModuleNavigation$',
      'loadModuleNavigation',
    ]);
    navigationServiceSpy.getModuleNavigation$.and.returnValue(of(mockNavigationItems));
    navigationServiceSpy.loadModuleNavigation.and.returnValue(of(mockNavigationItems));

    await TestBed.configureTestingModule({
      imports: [
        ManagementHeaderTabs,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: NavigationService, useValue: navigationServiceSpy },
      ],
    }).compileComponents();

    navigationService = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;
    fixture = TestBed.createComponent(ManagementHeaderTabs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load navigation items on init', () => {
    expect(navigationService.getModuleNavigation$).toHaveBeenCalledWith('nav-management');
    expect(navigationService.loadModuleNavigation).toHaveBeenCalledWith('nav-management');
    expect(component.items).toEqual(mockNavigationItems);
  });

  it('should display navigation tabs dynamically', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = compiled.querySelectorAll('a[id^="management-tab-"]');
    expect(tabs.length).toBe(mockNavigationItems.length);
  });

  it('should check if route is active', () => {
    const isActive = component.isActive('user');
    expect(typeof isActive).toBe('boolean');
  });

  it('should check if menu item is active', () => {
    const item: MenuItem = { routerLink: ['user'] };
    const isActive = component.isItemActive(item);
    expect(typeof isActive).toBe('boolean');
  });
});
