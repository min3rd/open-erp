import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
  OrganizationService,
  OrganizationInvitation,
  InvitationStatus,
} from '../../../../../../../core/services/organization-service';
import { OrganizationContextService } from '../../../../../../../core/services/organization-context.service';
import { UserDatePipe } from '../../../../../../../core/pipes/user-date.pipe';

@Component({
  selector: 'org-tab-invites',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    CardModule,
    TagModule,
    ButtonModule,
    SelectModule,
    SkeletonModule,
    PaginatorModule,
    TooltipModule,
    ConfirmDialogModule,
    UserDatePipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './invites.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Invites implements OnInit {
  private route = inject(ActivatedRoute);
  private organizationContextService = inject(OrganizationContextService);
  private organizationService = inject(OrganizationService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);

  protected readonly invites = signal<OrganizationInvitation[]>([]);
  protected readonly invitesTotal = signal(0);
  protected readonly isInvitesLoading = signal(false);
  protected readonly invitesPage = signal(1);
  protected readonly invitesLimit = signal(20);
  protected readonly invitesStatusFilter = signal<InvitationStatus | ''>('');
  protected readonly invitesSearchQuery = signal('');

  ngOnInit(): void {
    const resolved = this.route.snapshot.data['invites'] as {
      data: OrganizationInvitation[];
      total: number;
    } | null;
    if (resolved?.data) {
      this.invites.set(resolved.data);
      this.invitesTotal.set(resolved.total);
    } else {
      const orgId = this.organizationContextService.currentOrganization()?.id;
      if (orgId) this.loadInvitations(orgId);
    }
  }

  private loadInvitations(id: string): void {
    this.isInvitesLoading.set(true);
    const status = this.invitesStatusFilter();
    this.organizationService
      .getOrganizationInvitations(id, {
        status: status || undefined,
        page: this.invitesPage(),
        limit: this.invitesLimit(),
        query: this.invitesSearchQuery() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.invites.set(response.data);
          this.invitesTotal.set(response.total);
          this.isInvitesLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load invitations:', error);
          this.isInvitesLoading.set(false);
        },
      });
  }

  protected onInvitesFilterChange(): void {
    this.invitesPage.set(1);
    const id = this.organizationContextService.currentOrganization()?.id;
    if (id) this.loadInvitations(id);
  }

  protected onStatusFilterChange(value: InvitationStatus | ''): void {
    this.invitesStatusFilter.set(value);
    this.onInvitesFilterChange();
  }

  protected onInvitesPageChange(event: { page: number; rows: number } | any): void {
    this.invitesPage.set(event.page + 1);
    this.invitesLimit.set(event.rows);
    const id = this.organizationContextService.currentOrganization()?.id;
    if (id) this.loadInvitations(id);
  }

  protected onRevokeInvitation(invite: OrganizationInvitation): void {
    this.confirmationService.confirm({
      message: this.translocoService.translate('organization.detail.invites.confirmRevoke', {
        email: invite.inviteeEmail || invite.inviteeUserId || '',
      }),
      header: this.translocoService.translate('organization.detail.invites.confirmRevokeHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('organization.detail.invites.revokeButton'),
      rejectLabel: this.translocoService.translate('organization.detail.actions.cancel'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.organizationService.revokeInvitation(invite.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('organization.detail.invites.revokeSuccess'),
            });
            const id = this.organizationContextService.currentOrganization()?.id;
            if (id) this.loadInvitations(id);
          },
          error: (error: any) => {
            console.error('Revoke invitation failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('organization.detail.invites.revokeError'),
              detail: error?.error?.message || 'Failed to revoke invitation',
            });
          },
        });
      },
    });
  }

  protected getInvitedByEmail(invite: OrganizationInvitation): string {
    if (!invite.invitedBy) return '—';
    if (typeof invite.invitedBy === 'string') return invite.invitedBy;
    return invite.invitedBy.fullName || invite.invitedBy.email || '—';
  }

  protected getInvitationStatusSeverity(
    status: InvitationStatus,
  ): 'success' | 'warn' | 'secondary' | 'danger' | 'info' {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'pending':
        return 'warn';
      case 'revoked':
        return 'danger';
      case 'expired':
        return 'secondary';
      case 'rejected':
        return 'secondary';
      default:
        return 'info';
    }
  }
}
