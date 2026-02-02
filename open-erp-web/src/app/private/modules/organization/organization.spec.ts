import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Organization } from './organization';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { OrganizationLayoutService } from './services/organization-layout.service';

describe('Organization', () => {
  let component: Organization;
  let fixture: ComponentFixture<Organization>;
  let layoutService: OrganizationLayoutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Organization,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [provideRouter([]), OrganizationLayoutService],
    }).compileComponents();

    fixture = TestBed.createComponent(Organization);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(OrganizationLayoutService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have organization layout', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#organization-layout')).toBeTruthy();
  });

  it('should show mobile header tabs when in mobile view', () => {
    component.isMobile.set(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('organization-header-tabs')).toBeTruthy();
  });

  it('should show desktop navigation when not in mobile view', () => {
    component.isMobile.set(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('organization-nav')).toBeTruthy();
  });

  it('should update layout service with mobile state', () => {
    component.isMobile.set(true);
    fixture.detectChanges();
    expect(layoutService.isMobile()).toBe(true);

    component.isMobile.set(false);
    fixture.detectChanges();
    expect(layoutService.isMobile()).toBe(false);
  });
});
