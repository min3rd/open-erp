import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, combineLatest, takeUntil } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { SelectButtonModule } from 'primeng/selectbutton';
import { PaginatorModule } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constant';
import { MessageService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

// Services
import { UserService, User, GetUsersParams } from '../../../../../../core/services/user-service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';

@Component({
  selector: 'management-user-list',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    MenuModule,
    ContextMenuModule,
    SelectButtonModule,
    CheckboxModule,
    AvatarModule,
    TagModule,
    TooltipModule,
    InputGroupModule,
    InputGroupAddonModule,
    PaginatorModule,
  ],
  providers: [MessageService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit, OnDestroy {
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private organizationContext = inject(OrganizationContextService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100; // Delay for focusing search input to ensure DOM is ready
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  // State signals
  protected readonly users = signal<User[]>([]);
  protected readonly selectedUsers = signal<User[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly scope = signal<'global' | 'organization'>('global');
  protected readonly sortField = signal<string | undefined>(undefined);
  protected readonly sortOrder = signal<number>(1);
  protected selectedUser: User | null = null; // Used by PrimeNG contextMenuSelection
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly hasSelection = computed(() => this.selectedUsers().length > 0);
  protected readonly currentOrganization = computed(() =>
    this.organizationContext.currentOrganization(),
  );
  protected readonly allSelected = computed(
    () => this.users().length > 0 && this.selectedUsers().length === this.users().length,
  );

  // Scope options for toggle
  protected readonly scopeOptions = [
    { label: 'userList.scopeToggle.global', value: 'global', icon: 'pi pi-globe' },
    { label: 'userList.scopeToggle.organization', value: 'organization', icon: 'pi pi-building' },
  ];

  // Actions menu items getter for reactive disabled state
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('userList.actions.downloadCSV'),
        icon: 'pi pi-download',
        command: () => this.onDownloadCSV(),
      },
      {
        label: this.translocoService.translate('userList.actions.importUsers'),
        icon: 'pi pi-upload',
        command: () => this.onImportUsers(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('userList.actions.blockSelected'),
        icon: 'pi pi-ban',
        command: () => this.onBlockSelected(),
        disabled: !this.hasSelection(),
      },
      {
        label: this.translocoService.translate('userList.actions.revokeLoginSessions'),
        icon: 'pi pi-sign-out',
        command: () => this.onRevokeLoginSessions(),
        disabled: !this.hasSelection(),
      },
    ];
  }

  // Context menu items for row actions
  contextMenuItems!: MenuItem[];

  constructor() {
    // Load users when scope changes (handled in combineLatest)
    effect(() => {
      // We still need to reset page when scope changes exclusively inside the effect?
      // Actually this causes duplicate calls if we navigate, moving to onScopeChange instead.
    });

    // Detect mobile viewport
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }

    // Focus mobile search input when it opens
    effect(() => {
      if (this.isSearchOpen() && this.mobileSearchInput) {
        setTimeout(() => {
          this.mobileSearchInput?.nativeElement?.focus();
        }, this.SEARCH_FOCUS_DELAY);
      }
    });
  }

  ngOnInit(): void {
    // Combine route params and query params to avoid duplicate API calls
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, queryParams]) => {
        const pageStr = params['page'];
        const page = pageStr === '' || pageStr === undefined ? 1 : parseInt(pageStr, 10) || 1;
        const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
        const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
        const search = params['filter'] || '';

        this.currentPage.set(page);
        this.pageSize.set(normalizedLimit);
        this.searchQuery.set(search === 'all' ? '' : search);

        const scopeParam = queryParams['scope'];
        if (scopeParam === 'global' || scopeParam === 'organization') {
          if (this.scope() !== scopeParam) {
            this.scope.set(scopeParam);
          }
        }

        this.sortField.set(queryParams['sort'] || undefined);
        this.sortOrder.set(queryParams['order'] === 'desc' ? -1 : 1);

        // Load data once when parameters change
        this.loadUsers();
      });

    // Listen for organization changes
    this.organizationContext.organizationChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.scope() === 'organization') {
        this.loadUsers();
      }
    });

    this.contextMenuItems = [
      {
        label: this.translocoService.translate('userList.contextMenu.viewDetails'),
        icon: 'pi pi-eye',
        command: () => this.onViewUserDetails(this.selectedUser as User),
      },
      {
        label: this.translocoService.translate('userList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditUser(this.selectedUser as User),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('userList.contextMenu.block'),
        icon: 'pi pi-ban',
        command: () => this.onBlockUser(this.selectedUser as User),
      },
      {
        label: this.translocoService.translate('userList.contextMenu.revokeSession'),
        icon: 'pi pi-sign-out',
        command: () => this.onRevokeUserSession(this.selectedUser as User),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('userList.contextMenu.sendNotification'),
        icon: 'pi pi-send',
        command: () => this.onSendNotification(this.selectedUser as User),
      },
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Load users from the API
   */
  private loadUsers(): void {
    this.isLoading.set(true);

    const params: GetUsersParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchQuery() || undefined,
      scope: this.scope(),
      sortField: this.sortField(),
      sortOrder: this.sortOrder(),
    };

    if (this.scope() === 'organization' && this.currentOrganization()) {
      params.organizationId = this.currentOrganization()!.id;
    }

    this.userService.getUsers(params).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalRecords.set(response.total);
        this.isLoading.set(false);
        this.announceStatus(
          this.translocoService.translate('userList.messages.loaded', {
            count: response.data.length,
          }),
        );
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.loadFailed'),
        });
        this.isLoading.set(false);
        this.announceStatus(this.translocoService.translate('userList.messages.errorLoading'));
      },
    });
  }

  /**
   * Handle search input changes
   */
  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Update URL with relative navigation
    this.router.navigate(['../../../', input.value || 'all', 1, this.pageSize()], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Handle scope toggle change
   */
  protected onScopeChange(value: 'global' | 'organization'): void {
    // Reset page to 1 on scope change
    this.router.navigate(['../../../', this.searchQuery() || 'all', 1, this.pageSize()], {
      relativeTo: this.route,
      queryParams: { scope: value },
      queryParamsHandling: 'merge',
    });
    this.selectedUsers.set([]); // Clear selection on scope change
  }

  /**
   * Handle sort change
   */
  protected onSort(event: any): void {
    // Keep the current page, update sort queries
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: event.field,
        order: event.order === 1 ? 'asc' : 'desc',
      },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: any): void {
    const newPage = (event.first ?? 0) / (event.rows ?? this.pageSize()) + 1;
    const newPageSize = event.rows ?? this.pageSize();

    // Preserve existing sort and scope params when changing page
    this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, newPageSize], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Toggle select all users on current page
   */
  protected onToggleSelectAll(event: any): void {
    if (event.checked) {
      // Select all users on current page
      this.selectedUsers.set([...this.users()]);
    } else {
      // Deselect all
      this.selectedUsers.set([]);
    }
  }

  /**
   * Navigate to add new user
   */
  protected onAddUser(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Download users as CSV
   */
  protected onDownloadCSV(): void {
    const params: GetUsersParams = {
      search: this.searchQuery() || undefined,
      scope: this.scope(),
    };

    if (this.scope() === 'organization' && this.currentOrganization()) {
      params.organizationId = this.currentOrganization()!.id;
    }

    this.userService.exportToCSV(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Import users (placeholder)
   */
  protected onImportUsers(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('userList.messages.notImplemented'),
      detail: this.translocoService.translate('userList.messages.importSoon'),
    });
  }

  /**
   * Block selected users
   */
  protected onBlockSelected(): void {
    const userIds = this.selectedUsers().map((u) => u.id);
    if (userIds.length === 0) return;

    this.userService.blockUsers(userIds).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.messages.blockSuccess', {
            count: userIds.length,
          }),
        });
        this.selectedUsers.set([]);
        this.loadUsers();
      },
      error: (error) => {
        console.error('Block failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.blockFailed'),
        });
      },
    });
  }

  /**
   * Revoke login sessions for selected users
   */
  protected onRevokeLoginSessions(): void {
    const userIds = this.selectedUsers().map((u) => u.id);
    if (userIds.length === 0) return;

    this.userService.revokeLoginSessions(userIds).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.messages.revokeSuccess', {
            count: userIds.length,
          }),
        });
        this.selectedUsers.set([]);
      },
      error: (error) => {
        console.error('Revoke failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.revokeFailed'),
        });
      },
    });
  }

  /**
   * Get status tag severity
   */
  protected getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warn';
      case 'blocked':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Format date for display
   */
  protected formatDate(dateString: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * Announce status changes for screen readers
   */
  private announceStatus(message: string): void {
    // The status region in the template will announce this
    // This is handled by the aria-live region in the template
  }

  /**
   * Handle row click to navigate to user detail
   */
  protected onRowClick(user: User): void {
    this.router.navigate([user.id], { relativeTo: this.route });
  }

  /**
   * View user details
   */
  protected onViewUserDetails(user: User): void {
    this.router.navigate([user.id], { relativeTo: this.route });
  }

  /**
   * Edit user
   */
  protected onEditUser(user: User): void {
    this.router.navigate([user.id, 'edit'], { relativeTo: this.route });
  }

  /**
   * Block a single user
   */
  protected onBlockUser(user: User): void {
    this.userService.blockUsers([user.id]).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.contextMenu.blockSuccess', {
            name: user.fullName,
          }),
        });
        this.loadUsers();
      },
      error: (error) => {
        console.error('Block failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.blockFailed'),
        });
      },
    });
  }

  /**
   * Revoke login session for a single user
   */
  protected onRevokeUserSession(user: User): void {
    this.userService.revokeLoginSessions([user.id]).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.contextMenu.revokeSuccess', {
            name: user.fullName,
          }),
        });
      },
      error: (error) => {
        console.error('Revoke failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.revokeFailed'),
        });
      },
    });
  }

  /**
   * Send notification to user
   */
  protected onSendNotification(user: User): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('userList.messages.notImplemented'),
      detail: this.translocoService.translate('userList.contextMenu.sendNotificationSoon'),
    });
  }

  /**
   * Check viewport size to detect mobile
   */
  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  /**
   * Toggle search input visibility on mobile
   */
  protected toggleSearch(): void {
    this.isSearchOpen.set(!this.isSearchOpen());
  }

  /**
   * Close search on mobile
   */
  protected closeSearch(): void {
    this.isSearchOpen.set(false);
    this.searchQuery.set('');
    this.router.navigate(['../../../', 'all', 1, this.pageSize()], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Refresh user list
   */
  protected onRefresh(): void {
    this.loadUsers();
  }

  /**
   * Get user initials for avatar
   */
  protected getUserInitials(user: User): string {
    if (!user.fullName) {
      return '??';
    }

    const nameParts = user.fullName
      .split(' ')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (nameParts.length === 0) {
      return '??';
    }

    return nameParts
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Navigate to previous page
   */
  protected onPreviousPage(): void {
    if (this.currentPage() > 1) {
      const newPage = this.currentPage() - 1;
      this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, this.pageSize()], {
        relativeTo: this.route,
        queryParamsHandling: 'merge',
      });
    }
  }

  /**
   * Navigate to next page
   */
  protected onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      const newPage = this.currentPage() + 1;
      this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, this.pageSize()], {
        relativeTo: this.route,
        queryParamsHandling: 'merge',
      });
    }
  }

  /**
   * Change page size
   */
  protected onPageSizeChangeMobile(event: { value: number }): void {
    const newPageSize = event.value;
    this.router.navigate(['../../..', this.searchQuery() || 'all', 1, newPageSize], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Get per-row menu items for mobile list
   */
  protected getRowMenuItems(user: User): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('userList.contextMenu.viewDetails'),
        icon: 'pi pi-eye',
        command: () => this.onViewUserDetails(user),
      },
      {
        label: this.translocoService.translate('userList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditUser(user),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('userList.contextMenu.block'),
        icon: 'pi pi-ban',
        command: () => this.onBlockUser(user),
      },
      {
        label: this.translocoService.translate('userList.contextMenu.revokeSession'),
        icon: 'pi pi-sign-out',
        command: () => this.onRevokeUserSession(user),
      },
    ];
  }
}
