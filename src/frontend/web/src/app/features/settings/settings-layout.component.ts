import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TopbarComponent, TranslatePipe } from '@shared';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TopbarComponent, TranslatePipe],
  templateUrl: './settings-layout.component.html'
})
export class SettingsLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  readonly menuItems: ReadonlyArray<{ path: string; labelKey: string }> = [
    { path: '/settings/roles', labelKey: 'IAM_ROLE_MANAGEMENT' },
    { path: '/settings/organization', labelKey: 'ORGANIZATION_STRUCTURE' },
    { path: '/settings/members', labelKey: 'ORGANIZATION_MEMBERSHIPS' },
    { path: '/settings/branch-assignments', labelKey: 'ORGANIZATION_BRANCH_ASSIGNMENT_TITLE' },
    { path: '/settings/sample-records', labelKey: 'SAMPLE_RECORDS_TITLE' }
  ];

  openAccount() {
    this.router.navigate(['/account/detail']);
  }

  logout() {
    this.auth.logout();
  }
}
