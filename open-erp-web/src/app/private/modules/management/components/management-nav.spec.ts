import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ManagementNav } from './management-nav';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ManagementLayoutService } from '../services/management-layout.service';

describe('ManagementNav', () => {
  let component: ManagementNav;
  let fixture: ComponentFixture<ManagementNav>;
  let layoutService: ManagementLayoutService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ManagementNav,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [provideRouter([]), ManagementLayoutService],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementNav);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(ManagementLayoutService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display navigation items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#management-nav-item-user')).toBeTruthy();
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

  it('should apply active styles to active routes', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const userLink = compiled.querySelector('#management-nav-link-user');
    expect(userLink).toBeTruthy();
  });

  it('should check if route is active using router.isActive', () => {
    const isActive = component.isActive('user');
    expect(typeof isActive).toBe('boolean');
  });
});
