import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import {
  OrganizationService,
  OrganizationResponse,
} from '../../../../../../../core/services/organization-service';
import { OrganizationContextService } from '../../../../../../../core/services/organization-context.service';
import { UserDatePipe } from '../../../../../../../core/pipes/user-date.pipe';

@Component({
  selector: 'org-tab-general',
  imports: [CommonModule, CardModule, TagModule, UserDatePipe, TranslocoModule],
  templateUrl: './general.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class General implements OnInit {
  private route = inject(ActivatedRoute);
  private organizationContextService = inject(OrganizationContextService);
  private organizationService = inject(OrganizationService);

  protected readonly organization = signal<OrganizationResponse | null>(null);

  ngOnInit(): void {
    const resolved = this.route.snapshot.data['general'] as OrganizationResponse | null;
    if (resolved) {
      this.organization.set(resolved);
    } else {
      const orgId = this.organizationContextService.currentOrganization()?.id;
      if (orgId) {
        this.organizationService.getOrganization(orgId).subscribe({
          next: (org) => this.organization.set(org),
          error: (err) => console.error('Failed to load organization:', err),
        });
      }
    }
  }
}
