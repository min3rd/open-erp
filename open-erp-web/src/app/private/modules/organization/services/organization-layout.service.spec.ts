import { TestBed } from '@angular/core/testing';
import { OrganizationLayoutService } from './organization-layout.service';

describe('OrganizationLayoutService', () => {
  let service: OrganizationLayoutService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizationLayoutService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Nav Mode', () => {
    it('should initialize with default mode (sidebar)', () => {
      expect(service.navMode()).toBe('sidebar');
    });

    it('should load saved mode from localStorage', () => {
      // Clear localStorage and create fresh instance
      localStorage.clear();
      localStorage.setItem('organization.nav.mode', 'narrow');
      
      // Create a new service instance to test loading from localStorage
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(OrganizationLayoutService);
      
      expect(newService.navMode()).toBe('narrow');
    });

    it('should toggle nav mode from sidebar to narrow', () => {
      service.setNavMode('sidebar');
      service.toggleNavMode();
      expect(service.navMode()).toBe('narrow');
    });

    it('should toggle nav mode from narrow to sidebar', () => {
      service.setNavMode('narrow');
      service.toggleNavMode();
      expect(service.navMode()).toBe('sidebar');
    });

    it('should set nav mode directly', () => {
      service.setNavMode('narrow');
      expect(service.navMode()).toBe('narrow');

      service.setNavMode('sidebar');
      expect(service.navMode()).toBe('sidebar');
    });

    it('should persist nav mode to localStorage', async () => {
      service.setNavMode('narrow');
      // Wait a bit for effect to run
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(localStorage.getItem('organization.nav.mode')).toBe('narrow');
    });
  });

  describe('Mobile State', () => {
    it('should initialize mobile state as false', () => {
      expect(service.isMobile()).toBe(false);
    });

    it('should set mobile state', () => {
      service.setIsMobile(true);
      expect(service.isMobile()).toBe(true);

      service.setIsMobile(false);
      expect(service.isMobile()).toBe(false);
    });
  });

  describe('Mobile Menu', () => {
    it('should initialize mobile menu as not visible', () => {
      expect(service.mobileMenuVisible()).toBe(false);
    });

    it('should toggle mobile menu visibility', () => {
      service.toggleMobileMenu();
      expect(service.mobileMenuVisible()).toBe(true);

      service.toggleMobileMenu();
      expect(service.mobileMenuVisible()).toBe(false);
    });

    it('should set mobile menu visible state', () => {
      service.setMobileMenuVisible(true);
      expect(service.mobileMenuVisible()).toBe(true);

      service.setMobileMenuVisible(false);
      expect(service.mobileMenuVisible()).toBe(false);
    });
  });
});
