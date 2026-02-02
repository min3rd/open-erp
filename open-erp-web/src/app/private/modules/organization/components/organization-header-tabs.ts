import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';

@Component({
  selector: 'organization-header-tabs',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoModule],
  templateUrl: './organization-header-tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationHeaderTabs {
  private organizationContextService = inject(OrganizationContextService);

  router = inject(Router);
  curentOrganization = this.organizationContextService.currentOrganization;

  isActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  get activeTabIndex(): number {
    const url = this.router.url;
    if (url.includes('/new')) {
      return 0;
    } else if (url.includes('/detail')) {
      return 1;
    }
    return 0;
  }
}
