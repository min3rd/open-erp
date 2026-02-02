import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OrganizationHeaderTabs } from './organization-header-tabs';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('OrganizationHeaderTabs', () => {
  let component: OrganizationHeaderTabs;
  let fixture: ComponentFixture<OrganizationHeaderTabs>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrganizationHeaderTabs,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationHeaderTabs);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display tab navigation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#organization-tab-register')).toBeTruthy();
    expect(compiled.querySelector('#organization-tab-detail')).toBeTruthy();
  });

  it('should return correct active tab index based on route', () => {
    // Mock router URL for new route
    vi.spyOn(router, 'url', 'get').mockReturnValue('/modules/organization/new');
    expect(component.activeTabIndex).toBe(0);

    // Mock router URL for detail route
    vi.spyOn(router, 'url', 'get').mockReturnValue('/modules/organization/detail');
    expect(component.activeTabIndex).toBe(1);
  });
});
