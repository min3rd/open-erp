import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import {
  OrganizationService,
  OrganizationRelation,
} from '../../../../../../../core/services/organization-service';
import { OrganizationContextService } from '../../../../../../../core/services/organization-context.service';

@Component({
  selector: 'org-tab-relations',
  imports: [CommonModule, CardModule, TagModule, TranslocoModule],
  templateUrl: './relations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Relations implements OnInit {
  private organizationContextService = inject(OrganizationContextService);
  private organizationService = inject(OrganizationService);

  protected readonly relations = signal<OrganizationRelation[]>([]);

  ngOnInit(): void {
    const orgId = this.organizationContextService.currentOrganization()?.id;
    if (orgId) {
      this.organizationService.getOrganizationRelations(orgId).subscribe({
        next: (relations) => this.relations.set(relations),
        error: (err) => console.error('Failed to load relations:', err),
      });
    }
  }
}
