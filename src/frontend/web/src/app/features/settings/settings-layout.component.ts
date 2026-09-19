import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TopbarComponent, TranslatePipe } from '@shared';

interface SettingsMenuItem {
  path: string;
  labelKey: string;
  permission: string;
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TopbarComponent, TranslatePipe],
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
    { path: '/settings/sample-records', labelKey: 'SAMPLE_RECORDS_TITLE', permission: 'core:sample-record:read' }
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
