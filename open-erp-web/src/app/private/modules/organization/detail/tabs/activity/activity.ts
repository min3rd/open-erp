import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import {
  OrganizationService,
  OrganizationEvent,
} from '../../../../../../../core/services/organization-service';
import { OrganizationContextService } from '../../../../../../../core/services/organization-context.service';
import { UserDatePipe } from '../../../../../../../core/pipes/user-date.pipe';

@Component({
  selector: 'org-tab-activity',
  imports: [CommonModule, CardModule, TranslocoModule, UserDatePipe],
  templateUrl: './activity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Activity implements OnInit {
  private organizationContextService = inject(OrganizationContextService);
  private organizationService = inject(OrganizationService);

  protected readonly events = signal<OrganizationEvent[]>([]);
  protected readonly eventsTotal = signal(0);
  protected readonly eventsPage = signal(1);
  protected readonly eventsLimit = signal(20);

  ngOnInit(): void {
    const orgId = this.organizationContextService.currentOrganization()?.id;
    if (orgId) {
      this.organizationService
        .getOrganizationEvents(orgId, this.eventsPage(), this.eventsLimit())
        .subscribe({
          next: (response) => {
            this.events.set(response.data);
            this.eventsTotal.set(response.total);
          },
          error: (err) => console.error('Failed to load events:', err),
        });
    }
  }
}
