import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationSwitcher } from './organization-switcher';
import { OrganizationContextService } from '../../services/organization-context.service';
import { OrganizationService } from '../../services/organization-service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { getTranslocoModule } from '../../testing/transloco-testing.module';

describe('OrganizationSwitcher', () => {
  let component: OrganizationSwitcher;
  let fixture: ComponentFixture<OrganizationSwitcher>;
  let orgContextService: OrganizationContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationSwitcher, getTranslocoModule()],
      providers: [
        OrganizationContextService,
        OrganizationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    orgContextService = TestBed.inject(OrganizationContextService);
    fixture = TestBed.createComponent(OrganizationSwitcher);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render sidebar mode correctly', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org',
        taxId: '1234567890',
      },
    ];

    orgContextService.setUserOrganizations(mockOrgs);
    fixture.componentRef.setInput('mode', 'sidebar');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const sidebarMode = compiled.querySelector('#organization-switcher-sidebar-mode');
    expect(sidebarMode).toBeTruthy();
  });

  it('should render narrow mode correctly', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org',
        taxId: '1234567890',
      },
    ];

    orgContextService.setUserOrganizations(mockOrgs);
    fixture.componentRef.setInput('mode', 'narrow');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const narrowMode = compiled.querySelector('#organization-switcher-narrow-mode');
    expect(narrowMode).toBeTruthy();
  });

  it('should display organizations from organization context', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org',
        taxId: '1234567890',
      },
    ];

    orgContextService.setUserOrganizations(mockOrgs);
    fixture.detectChanges();

    expect(component.displayOrganizations().length).toBe(1);
  });

  it('should emit select event when organization is selected', (done) => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org 1',
        internationalName: 'Test Org 1',
        taxId: '1234567890',
      },
      {
        id: 'org-2',
        name: 'Test Org 2',
        internationalName: 'Test Org 2',
        taxId: '0987654321',
      },
    ];

    orgContextService.setUserOrganizations(mockOrgs);

    component.select.subscribe((orgId: string) => {
      expect(orgId).toBe('org-2');
      done();
    });

    component.onOrganizationSelect('org-2');
  });

  it('should emit create event when create button is clicked', (done) => {
    component.create.subscribe(() => {
      expect(true).toBe(true);
      done();
    });

    component.onCreateOrganization();
  });

  it('should set error when organization switch fails', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org',
        taxId: '1234567890',
      },
    ];

    orgContextService.setUserOrganizations(mockOrgs);
    spyOn(orgContextService, 'switchOrganization').and.returnValue(false);

    component.onOrganizationSelect('invalid-id');

    expect(component.error()).toBe('Failed to switch organization');
  });

  it('should filter organizations based on search query', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Alpha Corp',
        internationalName: 'Alpha Corp',
        taxId: '1111111111',
      },
      {
        id: 'org-2',
        name: 'Beta Inc',
        internationalName: 'Beta Inc',
        taxId: '2222222222',
      },
    ];

    orgContextService.setUserOrganizations(mockOrgs);
    fixture.detectChanges();

    component.searchQuery.set('alpha');
    fixture.detectChanges();

    const filtered = component.filteredOrganizations();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Alpha Corp');
  });

  it('should generate correct organization initials', () => {
    expect(component.getOrganizationInitials('Test Organization')).toBe('TO');
    expect(component.getOrganizationInitials('ABC')).toBe('AB');
    expect(component.getOrganizationInitials('Single')).toBe('SI');
  });

  it('should open and close organization dialog', () => {
    expect(component.showOrgDialog()).toBe(false);

    component.openOrganizationDialog();
    expect(component.showOrgDialog()).toBe(true);

    component.closeOrganizationDialog();
    expect(component.showOrgDialog()).toBe(false);
  });

  it('should have all required elements with unique IDs', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org',
        taxId: '1234567890',
      },
    ];

    orgContextService.setUserOrganizations(mockOrgs);
    fixture.componentRef.setInput('mode', 'sidebar');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('#organization-switcher-container')).toBeTruthy();
    expect(compiled.querySelector('#organization-switcher-sidebar-mode')).toBeTruthy();
    expect(compiled.querySelector('#organization-switcher-current')).toBeTruthy();
  });

  it('should have proper accessibility attributes', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org',
        taxId: '1234567890',
      },
    ];

    orgContextService.setUserOrganizations(mockOrgs);
    fixture.componentRef.setInput('mode', 'sidebar');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const currentButton = compiled.querySelector('#organization-switcher-current');
    expect(currentButton.getAttribute('aria-label')).toBeTruthy();
    expect(currentButton.getAttribute('aria-expanded')).toBeDefined();
  });

  it('should close dialog when organization is selected', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org',
        taxId: '1234567890',
      },
    ];

    orgContextService.setUserOrganizations(mockOrgs);
    component.openOrganizationDialog();
    expect(component.showOrgDialog()).toBe(true);

    component.onOrganizationSelect('org-1');
    expect(component.showOrgDialog()).toBe(false);
  });
});
