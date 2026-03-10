import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
  input,
  output,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import {
  OrganizationContextService,
  OrganizationMetadata,
} from '../../services/organization-context.service';
import { OrganizationService } from '../../services/organization-service';
import { AuthService } from '../../services/auth-service';
import { Popover } from 'primeng/popover';
import { InputText } from 'primeng/inputtext';
import { Dialog } from 'primeng/dialog';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { Tooltip } from 'primeng/tooltip';

export interface OrganizationOption {
  id: string;
  code?: string;
  name: string;
  logoUrl?: string;
  status?: 'active' | 'inactive' | 'pending';
}

@Component({
  selector: 'organization-switcher',
  imports: [
    CommonModule,
    TranslocoModule,
    Button,
    FormsModule,
    Popover,
    InputText,
    Dialog,
    InputGroup,
    InputGroupAddon,
    Tooltip,
  ],
  templateUrl: './organization-switcher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSwitcher implements OnInit {
  private organizationContextService = inject(OrganizationContextService);
  private organizationService = inject(OrganizationService);
  private authService = inject(AuthService);
  private translocoService = inject(TranslocoService);

  // Inputs
  mode = input<'sidebar' | 'narrow'>('sidebar');
  searchable = input<boolean>(true);
  organizations = input<OrganizationOption[]>([]);
  currentOrgId = input<string | null>(null);

  // Outputs
  select = output<string>();
  create = output<void>();

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  showOrgDialog = signal(false);

  // Current user signal for super admin check
  private _currentUser = toSignal(this.authService.user$, { initialValue: null });
  isSuperAdmin = computed(() => {
    const user = this._currentUser();
    return user?.roles?.includes('SUPER_ADMIN') ?? false;
  });

  // Internal organizations list
  private _internalOrganizations = this.organizationContextService.userOrganizations;
  private _selectedOrganization = this.organizationContextService.currentOrganization;

  // Computed properties
  currentOrganization = computed(() => {
    const orgId = this.currentOrgId();
    const orgs =
      this.organizations().length > 0 ? this.organizations() : this._internalOrganizations();
    return orgs.find((org) => org.id === orgId) || this._selectedOrganization();
  });

  displayOrganizations = computed(() => {
    return this.organizations().length > 0 ? this.organizations() : this._internalOrganizations();
  });

  filteredOrganizations = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const orgs = this.displayOrganizations();
    if (!query) return orgs;
    return orgs.filter((org) => {
      const matchesName = org.name.toLowerCase().includes(query);
      const matchesCode =
        'code' in org && typeof org.code === 'string'
          ? org.code.toLowerCase().includes(query)
          : false;
      const matchesTaxId =
        'taxId' in org && typeof org.taxId === 'string'
          ? org.taxId.toLowerCase().includes(query)
          : false;
      return matchesName || matchesCode || matchesTaxId;
    });
  });

  constructor() {
    // Watch for external currentOrgId changes
    effect(() => {
      const orgId = this.currentOrgId();
      if (orgId && orgId !== this._selectedOrganization()?.id) {
        this.organizationContextService.switchOrganization(orgId);
      }
    });
  }

  ngOnInit(): void {
    // Load user's organizations if not already loaded
    if (this._internalOrganizations().length === 0) {
      this.loadUserOrganizations();
    }

    // Watch for changes to selected organization from context
    this.organizationContextService.organizationChanged$.subscribe((org) => {
      if (org) {
        this.select.emit(org.id);
      }
    });
  }

  onOrganizationSelect(organizationId: string): void {
    if (organizationId) {
      const orgs = this.displayOrganizations();
      const org = orgs.find((o) => o.id === organizationId);
      if (org && org.status === 'inactive' && !this.isSuperAdmin()) {
        this.error.set(this.translocoService.translate('organizationSwitcher.inactiveOrgError'));
        return;
      }
      const success = this.organizationContextService.switchOrganization(organizationId);
      if (success) {
        this.select.emit(organizationId);
        this.showOrgDialog.set(false);
        this.searchQuery.set('');
      } else {
        this.error.set('Failed to switch organization');
      }
    }
  }

  onCreateOrganization(): void {
    this.create.emit();
    this.showOrgDialog.set(false);
  }

  openOrganizationDialog(): void {
    this.showOrgDialog.set(true);
    this.searchQuery.set('');
  }

  closeOrganizationDialog(): void {
    this.showOrgDialog.set(false);
    this.searchQuery.set('');
  }

  getOrganizationInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isOrgSelectable(org: OrganizationMetadata | OrganizationOption): boolean {
    if (this.isSuperAdmin()) return true;
    return org.status !== 'inactive';
  }

  private loadUserOrganizations(): void {
    this.loading.set(true);
    this.error.set(null);

    this.organizationService.getUserOrganizations().subscribe({
      next: (orgs) => {
        const mappedOrganizations: OrganizationMetadata[] = orgs.map((org) => ({
          id: org.id,
          name: org.name,
          internationalName: org.internationalName,
          taxId: org.taxId,
          status: org.status,
        }));
        this.organizationContextService.setUserOrganizations(mappedOrganizations);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load user organizations:', err);
        this.error.set('Failed to load organizations');
        this.loading.set(false);
      },
    });
  }
}
