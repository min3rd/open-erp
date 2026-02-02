import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'management-header-tabs',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoModule],
  templateUrl: './management-header-tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementHeaderTabs {
  router = inject(Router);

  isActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }
}
