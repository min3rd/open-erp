import { Injectable, signal, effect } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface OrganizationMetadata {
  id: string;
  name: string;
  internationalName: string;
  taxId: string;
  logoUrl?: string;
  code?: string;
  status?: 'active' | 'inactive' | 'pending';
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationContextService {
  private readonly STORAGE_KEY = 'app.organization.currentOrgId';

  // Current selected organization
  private _currentOrganization = signal<OrganizationMetadata | null>(null);

  // Available organizations for the user
  private _userOrganizations = signal<OrganizationMetadata[]>([]);

  // Subject for organization change events
  private _organizationChanged$ = new Subject<OrganizationMetadata | null>();

  get currentOrganization() {
    return this._currentOrganization.asReadonly();
  }

  get userOrganizations() {
    return this._userOrganizations.asReadonly();
  }

  get organizationChanged$(): Observable<OrganizationMetadata | null> {
    return this._organizationChanged$.asObservable();
  }

  constructor() {
    // Persist current organization ID to localStorage
    effect(() => {
      const org = this._currentOrganization();
      if (org) {
        this.saveCurrentOrgId(org.id);
      } else {
        this.clearCurrentOrgId();
      }
    });
  }

  /**
   * Set the list of organizations available to the user
   */
  setUserOrganizations(organizations: OrganizationMetadata[]): void {
    this._userOrganizations.set(organizations);

    // If we have a saved org ID, try to restore it
    const savedOrgId = this.loadCurrentOrgId();
    if (savedOrgId && organizations.length > 0) {
      const savedOrg = organizations.find((org) => org.id === savedOrgId);
      if (savedOrg) {
        this.setCurrentOrganization(savedOrg);
        return;
      }
    }

    // Otherwise, select the first organization if available
    if (organizations.length > 0 && !this._currentOrganization()) {
      this.setCurrentOrganization(organizations[0]);
    }
  }

  /**
   * Set the current active organization
   */
  setCurrentOrganization(organization: OrganizationMetadata | null): void {
    this._currentOrganization.set(organization);
    this._organizationChanged$.next(organization);
  }

  /**
   * Switch to a different organization by ID
   */
  switchOrganization(organizationId: string): boolean {
    const org = this._userOrganizations().find((o) => o.id === organizationId);
    if (org) {
      this.setCurrentOrganization(org);
      return true;
    }
    return false;
  }

  /**
   * Clear the current organization selection
   */
  clearCurrentOrganization(): void {
    this._currentOrganization.set(null);
    this._organizationChanged$.next(null);
    this.clearCurrentOrgId();
  }

  private loadCurrentOrgId(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return localStorage.getItem(this.STORAGE_KEY);
  }

  private saveCurrentOrgId(orgId: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, orgId);
    }
  }

  private clearCurrentOrgId(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
