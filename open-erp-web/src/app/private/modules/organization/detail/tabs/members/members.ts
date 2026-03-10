import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  OrganizationService,
  OrganizationMember,
  OrgDepartment,
  OrgPosition,
} from '../../../../../../../core/services/organization-service';
import { OrganizationContextService } from '../../../../../../../core/services/organization-context.service';
import { UserDatePipe } from '../../../../../../../core/pipes/user-date.pipe';
import { PersonnelSettings } from '../../personnel-settings/personnel-settings';

@Component({
  selector: 'org-tab-members',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    PaginatorModule,
    TooltipModule,
    ConfirmDialogModule,
    UserDatePipe,
    PersonnelSettings,
  ],
  providers: [ConfirmationService],
  templateUrl: './members.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Members implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  protected readonly organizationContextService = inject(OrganizationContextService);
  private organizationService = inject(OrganizationService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private membersSearchSubject$ = new Subject<string>();

  protected readonly members = signal<OrganizationMember[]>([]);
  protected readonly membersTotal = signal(0);
  protected readonly membersPage = signal(1);
  protected readonly membersLimit = signal(20);
  protected readonly isMembersLoading = signal(false);
  protected readonly membersSearchQuery = signal('');
  protected readonly membersDeptFilter = signal('');
  protected readonly membersPositionFilter = signal('');
  protected readonly membersRoleFilter = signal('');
  protected readonly membersStatusFilter = signal('');
  protected readonly membersSortField = signal('joinedAt');
  protected readonly membersSortOrder = signal<'asc' | 'desc'>('desc');
  protected readonly deptFilterOptions = signal<OrgDepartment[]>([]);
  protected readonly positionFilterOptions = signal<OrgPosition[]>([]);
  protected readonly showPersonnelSettings = signal(false);
  protected readonly personnelMember = signal<OrganizationMember | null>(null);

  protected readonly orgId = computed(
    () => this.organizationContextService.currentOrganization()?.id ?? null,
  );

  protected readonly deptFilterSelectOptions = computed(() => [
    {
      label: this.translocoService.translate('organization.detail.members.allDepartments'),
      value: '',
    },
    ...this.deptFilterOptions().map((d) => ({ label: d.name, value: d.id })),
  ]);

  ngOnInit(): void {
    const resolved = this.route.snapshot.data['members'] as {
      items: OrganizationMember[];
      total: number;
    } | null;
    if (resolved) {
      this.members.set(resolved.items);
      this.membersTotal.set(resolved.total);
    }

    this.membersSearchSubject$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.membersPage.set(1);
        const id = this.orgId();
        if (id) this.loadMembers(id);
      });

    const id = this.orgId();
    if (id) {
      this.loadDeptAndPositionFilters(id);
      if (!resolved) {
        this.loadMembers(id);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMembers(id: string): void {
    this.isMembersLoading.set(true);
    this.organizationService
      .getOrganizationMembers(id, 1, 20, {
        page: this.membersPage(),
        size: this.membersLimit(),
        q: this.membersSearchQuery() || undefined,
        department: this.membersDeptFilter() || undefined,
        position: this.membersPositionFilter() || undefined,
        role: this.membersRoleFilter() || undefined,
        status: this.membersStatusFilter() || undefined,
        sort: `${this.membersSortField()}:${this.membersSortOrder()}`,
      })
      .subscribe({
        next: (response) => {
          this.members.set(response.data ?? response.items ?? []);
          this.membersTotal.set(response.total);
          this.isMembersLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load members:', error);
          this.isMembersLoading.set(false);
        },
      });
  }

  private loadDeptAndPositionFilters(orgId: string): void {
    this.organizationService.getDepartments(orgId).subscribe({
      next: (depts) => this.deptFilterOptions.set(depts),
      error: () => {},
    });
    this.organizationService.getPositions(orgId).subscribe({
      next: (positions) => this.positionFilterOptions.set(positions),
      error: () => {},
    });
  }

  protected onMembersSearchChange(query: string): void {
    this.membersSearchQuery.set(query);
    this.membersSearchSubject$.next(query);
  }

  protected onMembersFilterChange(): void {
    this.membersPage.set(1);
    const id = this.orgId();
    if (id) this.loadMembers(id);
  }

  protected onDeptFilterChange(value: string): void {
    this.membersDeptFilter.set(value);
    this.onMembersFilterChange();
  }

  protected onStatusFilterChange(value: string): void {
    this.membersStatusFilter.set(value);
    this.onMembersFilterChange();
  }

  protected onMembersLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows && event.rows > 0 ? event.rows : this.membersLimit();
    const page = event.first !== undefined ? Math.floor(event.first / rows) + 1 : 1;
    this.membersPage.set(page);
    this.membersLimit.set(rows);
    if (event.sortField) {
      this.membersSortField.set(event.sortField as string);
      this.membersSortOrder.set(event.sortOrder === 1 ? 'asc' : 'desc');
    }
    const id = this.orgId();
    if (id) this.loadMembers(id);
  }

  protected onMembersSort(event: { field: string; order: number }): void {
    this.membersSortField.set(event.field);
    this.membersSortOrder.set(event.order === 1 ? 'asc' : 'desc');
    this.membersPage.set(1);
    const id = this.orgId();
    if (id) this.loadMembers(id);
  }

  protected onMembersPageChange(event: { page: number; rows: number } | any): void {
    this.membersPage.set(event.page + 1);
    this.membersLimit.set(event.rows);
    const id = this.orgId();
    if (id) this.loadMembers(id);
  }

  protected getMemberInitials(member: OrganizationMember): string {
    const name = member.name || member.fullName || member.email;
    return name.charAt(0).toUpperCase();
  }

  protected formatRoles(member: OrganizationMember): string {
    return member.roles?.join(', ') || member.role || '—';
  }

  protected getMemberStatusSeverity(status: string): 'success' | 'warn' | 'secondary' | 'danger' {
    switch (status) {
      case 'active':
        return 'success';
      case 'invited':
      case 'pending':
        return 'warn';
      case 'suspended':
      case 'revoked':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  protected onRemoveMember(memberId: string): void {
    const id = this.orgId();
    if (!id) return;

    this.confirmationService.confirm({
      message: this.translocoService.translate('organization.detail.members.confirmRemove'),
      header: this.translocoService.translate('organization.detail.members.confirmRemoveHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.organizationService.removeMember(id, memberId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('organization.detail.members.removeSuccess'),
            });
            this.loadMembers(id);
          },
          error: (error: any) => {
            console.error('Remove member failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Failed to remove member',
              detail: error?.error?.message || 'An error occurred',
            });
          },
        });
      },
    });
  }

  protected onOpenPersonnelSettings(member?: OrganizationMember): void {
    this.personnelMember.set(member ?? null);
    this.showPersonnelSettings.set(true);
  }

  protected onPersonnelSettingsSaved(): void {
    this.showPersonnelSettings.set(false);
    const id = this.orgId();
    if (id) this.loadMembers(id);
  }
}
