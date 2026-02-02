import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OrganizationNav } from './organization-nav';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { OrganizationLayoutService } from '../services/organization-layout.service';

describe('OrganizationNav', () => {
  let component: OrganizationNav;
  let fixture: ComponentFixture<OrganizationNav>;
  let layoutService: OrganizationLayoutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OrganizationNav,
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

    fixture = TestBed.createComponent(OrganizationNav);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(OrganizationLayoutService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display navigation items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#organization-nav-item-register')).toBeTruthy();
    expect(compiled.querySelector('#organization-nav-item-detail')).toBeTruthy();
  });

  it('should toggle nav mode when button is clicked', () => {
    const initialMode = component.navMode();
    component.onToggleNavMode();
    expect(component.navMode()).not.toBe(initialMode);
  });

  it('should reflect current nav mode from service', () => {
    layoutService.setNavMode('narrow');
    fixture.detectChanges();
    expect(component.navMode()).toBe('narrow');

    layoutService.setNavMode('sidebar');
    fixture.detectChanges();
    expect(component.navMode()).toBe('sidebar');
  });
});
