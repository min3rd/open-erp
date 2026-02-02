import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ManagementHeaderTabs } from './management-header-tabs';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('ManagementHeaderTabs', () => {
  let component: ManagementHeaderTabs;
  let fixture: ComponentFixture<ManagementHeaderTabs>;

  beforeEach(async () => {
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
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementHeaderTabs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user tab', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#management-tab-user')).toBeTruthy();
  });

  it('should check if route is active', () => {
    const isActive = component.isActive('user');
    expect(typeof isActive).toBe('boolean');
  });
});
