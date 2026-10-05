import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TopbarComponent, SectionNavComponent } from '@shared';

interface SettingsMenuItem {
  path: string;
  labelKey: string;
  permission: string;
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, SectionNavComponent],
  templateUrl: './settings-layout.component.html'
})
export class SettingsLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  readonly allMenuItems: ReadonlyArray<SettingsMenuItem> = [
    { path: '/settings/roles', labelKey: 'IAM_ROLE_MANAGEMENT', permission: 'core:role:manage' },
    { path: '/settings/organization', labelKey: 'ORGANIZATION_STRUCTURE', permission: 'core:organization:manage' },
    { path: '/settings/members', labelKey: 'ORGANIZATION_MEMBERSHIPS', permission: 'core:organization:manage' },
    { path: '/settings/branch-assignments', labelKey: 'ORGANIZATION_BRANCH_ASSIGNMENT_TITLE', permission: 'core:organization:manage' },
    { path: '/settings/sample-records', labelKey: 'SAMPLE_RECORDS_TITLE', permission: 'core:sample-record:read' },
    { path: '/settings/plugins', labelKey: 'PLUGIN_MARKETPLACE_TITLE', permission: 'core:plugin:read' },
    { path: '/settings/plugin-credentials', labelKey: 'PLUGIN_TENANT_CREDENTIALS_TITLE', permission: 'core:plugin:credential:manage' }
  ];

  // Fallback: when the Sprint 02 `permissions` claim is absent from the JWT,
  // `hasPermission()` returns `null` and every menu item stays visible.
  readonly menuItems = computed(() =>
    this.allMenuItems.filter((item) => this.auth.hasPermission(item.permission) !== false)
  );

  openAccount() {
    this.router.navigate(['/account/detail']);
  }

  logout() {
    this.auth.logout();
  }
}
