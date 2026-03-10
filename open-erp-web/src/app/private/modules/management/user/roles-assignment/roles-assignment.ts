import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { MpToolbar } from '../../../../../../core/components/toolbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { MultiSelect } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';

// Services and types
import {
  UserDetailService,
  UserDetail,
  UserRolesPermissions,
  OrganizationBasic,
  Role,
  Permission,
} from '../services/user-detail.service';
import { UserRolesPermissionsData } from '../resolvers/user-roles-permissions.resolver';
import { AuthService } from '../../../../../../core/services/auth-service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import { UserDto } from '../../../../../../core/interfaces/user.types';

type ScopeType = 'global' | 'organization';

interface ScopeOption {
  label: string;
  value: ScopeType;
}

@Component({
  selector: 'management-user-roles-assignment',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    MpToolbar,
    SelectButtonModule,
    TableModule,
    TagModule,
    SkeletonModule,
    ButtonModule,
    Dialog,
    MultiSelect,
  ],
  templateUrl: './roles-assignment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesAssignment implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private userDetailService = inject(UserDetailService);
  private authService = inject(AuthService);
  private orgContextService = inject(OrganizationContextService);
  private translocoService = inject(TranslocoService);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();

  // State signals
  protected readonly user = signal<UserDetail | null>(null);
  protected readonly currentUser = signal<UserDto | null>(null);
  protected readonly rolesPermissions = signal<UserRolesPermissions | null>(null);
  protected readonly organizations = signal<OrganizationBasic[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly selectedScope = signal<ScopeType>('organization');
  protected readonly currentOrganization = this.orgContextService.currentOrganization;

  // Dialog states
  protected readonly showGrantRolesPanel = signal(false);
  protected readonly showManageOrgRolesDialog = signal(false);
  protected readonly selectedOrgForManage = signal<OrganizationBasic | null>(null);
  protected readonly availableRoles = signal<Role[]>([]);
  protected readonly selectedRoleIds = signal<string[]>([]);
  protected readonly isGrantingRoles = signal(false);
  protected readonly grantRolesScope = signal<'global' | 'organization'>('organization');

  // Scope options for SelectButton
  protected readonly scopeOptions = computed<ScopeOption[]>(() => [
    {
      label: this.translocoService.translate('userDetail.rolesAssignment.scopeSelector.global'),
      value: 'global',
    },
    {
      label: this.translocoService.translate(
        'userDetail.rolesAssignment.scopeSelector.organization',
      ),
      value: 'organization',
    },
  ]);

  // Check if current user has global permissions
  // Super admin users bypass all permission checks
  protected readonly hasGlobalPermissions = computed(() => {
    const user = this.currentUser();
    if (!user) return false;

    // Super admin role bypasses all permission checks
    if (user.roles && user.roles.includes('SUPER_ADMIN')) {
      return true;
    }

    // Otherwise check for specific permissions
    if (!user.permissions) return false;
    const permissions = user.permissions;
    return permissions.includes('MANAGE_USER') || permissions.includes('MANAGE_ORG');
  });

  // Computed values for display
  protected readonly globalRoles = computed(() => this.rolesPermissions()?.globalRoles || []);

  protected readonly globalPermissions = computed(
    () => this.rolesPermissions()?.globalPermissions || [],
  );

  protected readonly orgRoles = computed(() => this.rolesPermissions()?.orgRoles || []);

  protected readonly orgPermissions = computed(() => this.rolesPermissions()?.orgPermissions || []);

  ngOnInit(): void {
    // Get current authenticated user
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user: UserDto | null) => {
      this.currentUser.set(user);
    });

    // Get user from parent route resolver
    this.route.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['userDetail']) {
        const userData = data['userDetail'] as UserDetail;
        this.user.set(userData);
      }
    });

    // Get roles/permissions data from route resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['rolesPermissionsData']) {
        const rpData = data['rolesPermissionsData'] as UserRolesPermissionsData;
        this.rolesPermissions.set(rpData.rolesPermissions);
        this.organizations.set(rpData.organizations);
      }
    });

    // Subscribe to user updates from service
    this.userDetailService.userUpdated$.pipe(takeUntil(this.destroy$)).subscribe((updatedUser) => {
      if (updatedUser && updatedUser.id === this.user()?.id) {
        this.user.set(updatedUser);
        this.reloadRolesPermissions();
      }
    });

    // Subscribe to organization changes
    this.orgContextService.organizationChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.selectedScope() === 'organization') {
        this.reloadRolesPermissions();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Reload roles and permissions data
   */
  private reloadRolesPermissions(): void {
    const userData = this.user();
    if (!userData) return;

    this.isLoading.set(true);

    const orgId =
      this.selectedScope() === 'organization' ? this.currentOrganization()?.id : undefined;

    this.userDetailService
      .getUserRolesPermissions(userData.id, orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.rolesPermissions.set(data);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load roles/permissions:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: this.translocoService.translate('userDetail.rolesAssignment.loadError'),
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Handle scope change
   */
  protected onScopeChange(event: any): void {
    if (event && event.value) {
      this.selectedScope.set(event.value);
      this.reloadRolesPermissions();
    }
  }

  /**
   * Open grant roles panel (inline form instead of modal)
   */
  protected openGrantRolesPanel(scope: 'global' | 'organization'): void {
    const orgId = scope === 'organization' ? this.currentOrganization()?.id : undefined;

    this.grantRolesScope.set(scope);
    this.isLoading.set(true);
    this.userDetailService
      .getAvailableRoles(orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.availableRoles.set(roles);
          this.selectedRoleIds.set([]);
          this.showGrantRolesPanel.set(true);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load available roles:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: this.translocoService.translate('userDetail.rolesAssignment.loadError'),
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Grant roles to user
   */
  protected grantRoles(): void {
    const userData = this.user();
    const orgId = this.currentOrganization()?.id;
    const roleIds = this.selectedRoleIds();

    if (!userData || roleIds.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('userDetail.messages.error'),
        detail: this.translocoService.translate(
          'userDetail.rolesAssignment.dialogs.grantRoles.error',
        ),
      });
      return;
    }

    if (!orgId) {
      // Global role grants are not yet supported by the backend; provide clear UI feedback
      this.messageService.add({
        severity: 'warn',
        summary: this.translocoService.translate('userDetail.messages.error'),
        detail: 'Global role grants are not yet implemented. Please select an organization scope.',
      });
      this.showGrantRolesPanel.set(false);
      return;
    }

    this.isGrantingRoles.set(true);
    this.userDetailService
      .grantRolesToUserInOrg(orgId, userData.id, roleIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('userDetail.messages.success'),
            detail: this.translocoService.translate(
              'userDetail.rolesAssignment.dialogs.grantRoles.success',
            ),
          });
          this.showGrantRolesPanel.set(false);
          this.isGrantingRoles.set(false);
          this.reloadRolesPermissions();
        },
        error: (error) => {
          console.error('Failed to grant roles:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: this.translocoService.translate(
              'userDetail.rolesAssignment.dialogs.grantRoles.error',
            ),
          });
          this.isGrantingRoles.set(false);
        },
      });
  }

  /**
   * Open manage organization roles dialog
   */
  protected openManageOrgRolesDialog(org: OrganizationBasic): void {
    this.selectedOrgForManage.set(org);
    this.isLoading.set(true);

    this.userDetailService
      .getAvailableRoles(org.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.availableRoles.set(roles);

          // Load current roles for this organization from the memberships
          const userData = this.user();
          if (userData) {
            this.userDetailService
              .getUserRolesPermissions(userData.id, org.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (rolesPerms) => {
                  const currentRoleIds = (rolesPerms.orgRoles || []).map((r) => r.id);
                  this.selectedRoleIds.set(currentRoleIds);
                  this.showManageOrgRolesDialog.set(true);
                  this.isLoading.set(false);
                },
                error: (error) => {
                  console.error('Failed to load current roles:', error);
                  this.selectedRoleIds.set([]);
                  this.showManageOrgRolesDialog.set(true);
                  this.isLoading.set(false);
                },
              });
          }
        },
        error: (error) => {
          console.error('Failed to load available roles:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: this.translocoService.translate('userDetail.rolesAssignment.loadError'),
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Save organization roles
   * The grant endpoint replaces all roles, so we just send the selected roles
   */
  protected saveOrgRoles(): void {
    const userData = this.user();
    const org = this.selectedOrgForManage();
    const selectedRoleIds = this.selectedRoleIds();

    if (!userData || !org) return;

    this.isGrantingRoles.set(true);

    // The grant endpoint replaces all roles with the provided ones
    this.userDetailService
      .grantRolesToUserInOrg(org.id, userData.id, selectedRoleIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('userDetail.messages.success'),
            detail: this.translocoService.translate(
              'userDetail.rolesAssignment.dialogs.manageOrgRoles.success',
            ),
          });
          this.showManageOrgRolesDialog.set(false);
          this.isGrantingRoles.set(false);

          // Reload organizations to get updated roles
          this.userDetailService
            .getUserOrganizations(userData.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((orgs) => {
              this.organizations.set(orgs);
            });
        },
        error: (error) => {
          console.error('Failed to save organization roles:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: this.translocoService.translate(
              'userDetail.rolesAssignment.dialogs.manageOrgRoles.error',
            ),
          });
          this.isGrantingRoles.set(false);
        },
      });
  }

  /**
   * Close grant roles panel
   */
  protected closeGrantRolesPanel(): void {
    this.showGrantRolesPanel.set(false);
    this.selectedRoleIds.set([]);
    this.availableRoles.set([]);
  }

  /**
   * Close manage org roles dialog
   */
  protected closeManageOrgRolesDialog(): void {
    this.showManageOrgRolesDialog.set(false);
    this.selectedOrgForManage.set(null);
    this.selectedRoleIds.set([]);
  }

  /**
   * Handle role selection change
   */
  protected onRoleSelectionChange(roleIds: string[]): void {
    this.selectedRoleIds.set(roleIds);
  }

  /**
   * Format date for display
   */
  protected formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  }
}
