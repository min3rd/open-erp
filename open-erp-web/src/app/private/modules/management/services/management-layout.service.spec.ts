import { TestBed } from '@angular/core/testing';
import { ManagementLayoutService } from './management-layout.service';

describe('ManagementLayoutService', () => {
  let service: ManagementLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManagementLayoutService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default sidebar mode', () => {
    expect(service.navMode()).toBe('sidebar');
  });

  it('should toggle between narrow and sidebar modes', () => {
    expect(service.navMode()).toBe('sidebar');
    service.toggleNavMode();
    expect(service.navMode()).toBe('narrow');
    service.toggleNavMode();
    expect(service.navMode()).toBe('sidebar');
  });

  it('should persist nav mode to localStorage', () => {
    service.setNavMode('narrow');
    expect(localStorage.getItem('management.nav.mode')).toBe('narrow');
    service.setNavMode('sidebar');
    expect(localStorage.getItem('management.nav.mode')).toBe('sidebar');
  });

  it('should load nav mode from localStorage', () => {
    localStorage.setItem('management.nav.mode', 'narrow');
    const newService = new ManagementLayoutService();
    expect(newService.navMode()).toBe('narrow');
  });

  it('should update mobile state', () => {
    expect(service.isMobile()).toBe(false);
    service.setIsMobile(true);
    expect(service.isMobile()).toBe(true);
  });

  it('should toggle mobile menu visibility', () => {
    expect(service.mobileMenuVisible()).toBe(false);
    service.toggleMobileMenu();
    expect(service.mobileMenuVisible()).toBe(true);
    service.toggleMobileMenu();
    expect(service.mobileMenuVisible()).toBe(false);
  });
});
