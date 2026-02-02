import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  ActivatedRoute,
  RouterOutlet,
  NavigationEnd,
  RouterLinkWithHref,
} from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil, filter } from 'rxjs';

// PrimeNG imports
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { MessageService } from 'primeng/api';

// Services and types
import { UserDetailService, UserDetail } from '../services/user-detail.service';

@Component({
  selector: 'management-user-detail',
  imports: [
    CommonModule,
    RouterOutlet,
    TranslocoModule,
    DrawerModule,
    ButtonModule,
    TabsModule,
    AvatarModule,
    TagModule,
    TooltipModule,
    MenuModule,
    RouterLinkWithHref,
  ],
  templateUrl: './detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Detail implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userDetailService = inject(UserDetailService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // State signals
  protected readonly isOpen = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly user = signal<UserDetail | null>(null);
  protected readonly isMobile = signal(false);
  protected readonly activeTab = signal<string>('general');

  // Computed values
  protected readonly userInitials = computed(() => {
    const currentUser = this.user();
    if (!currentUser || !currentUser.fullName) {
      return '??';
    }
    const nameParts = currentUser.fullName
      .split(' ')
      .map((part: string) => part.trim())
      .filter((part: string) => part.length > 0);
    if (nameParts.length === 0) {
      return '??';
    }
    return nameParts
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  });

  protected readonly statusSeverity = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return 'secondary';
    switch (currentUser.status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warn';
      case 'blocked':
        return 'danger';
      default:
        return 'secondary';
    }
  });

  // Action menu items
  protected get actionMenuItems(): MenuItem[] {
    const currentUser = this.user();
    if (!currentUser) return [];

    return [
      {
        label: this.translocoService.translate('userDetail.actions.resetPassword'),
        icon: 'pi pi-key',
        command: () => this.onResetPassword(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('userDetail.actions.disable'),
        icon: 'pi pi-ban',
        command: () => this.onDisableUser(),
        visible: currentUser.status === 'active',
      },
      {
        label: this.translocoService.translate('userDetail.actions.enable'),
        icon: 'pi pi-check-circle',
        command: () => this.onEnableUser(),
        visible: currentUser.status !== 'active',
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('userDetail.actions.impersonate'),
        icon: 'pi pi-user-edit',
        command: () => this.onImpersonate(),
      },
    ];
  }

  constructor() {
    // Detect mobile viewport
    this.checkViewport();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkViewport());
    }
  }

  ngOnInit(): void {
    // Get resolved data from route
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['userDetail']) {
        this.user.set(data['userDetail']);
      }
    });

    // Subscribe to route params to reload when ID changes
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const userId = params['id'];
      if (userId && (!this.user() || this.user()!.id !== userId)) {
        this.loadUser(userId);
      }
    });

    // Subscribe to user updates from service
    this.userDetailService.userUpdated$.pipe(takeUntil(this.destroy$)).subscribe((updatedUser) => {
      if (updatedUser && updatedUser.id === this.user()?.id) {
        this.user.set(updatedUser);
      }
    });

    // Sync active tab with current route
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateActiveTabFromRoute();
      });

    // Set initial tab
    this.updateActiveTabFromRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update active tab based on current route
   */
  private updateActiveTabFromRoute(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/roles-assignment')) {
      this.activeTab.set('roles-assignment');
    } else if (currentUrl.includes('/reset-password')) {
      this.activeTab.set('reset-password');
    } else if (currentUrl.includes('/audit-logs')) {
      this.activeTab.set('audit-logs');
    } else {
      this.activeTab.set('general');
    }
  }

  /**
   * Load user by ID
   */
  private loadUser(userId: string): void {
    this.isLoading.set(true);
    this.userDetailService
      .getUserDetail(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load user:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: this.translocoService.translate('userDetail.messages.loadFailed'),
          });
          this.isLoading.set(false);
          this.onClose();
        },
      });
  }

  /**
   * Handle drawer close
   */
  protected onClose(): void {
    // Navigate back to list (go up 1 level)
    this.router.navigate(['..'], { relativeTo: this.route }).then(() => {
      this.isOpen.set(false);
    });
  }

  /**
   * Handle edit button click
   */
  protected onEdit(): void {
    this.router.navigate(['edit'], { relativeTo: this.route });
  }

  /**
   * Handle tab change
   */
  protected onTabChange(event: any): void {
    const newTab = event.value;
    this.activeTab.set(newTab);

    // Navigate to the corresponding route
    switch (newTab) {
      case 'general':
        this.router.navigate(['.'], { relativeTo: this.route });
        break;
      case 'roles-assignment':
        this.router.navigate(['roles-assignment'], { relativeTo: this.route });
        break;
      case 'reset-password':
        this.router.navigate(['reset-password'], { relativeTo: this.route });
        break;
      case 'audit-logs':
        this.router.navigate(['audit-logs'], { relativeTo: this.route });
        break;
    }
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
   * Format date for display
   */
  protected formatDate(dateString?: string): string {
    if (!dateString) return this.translocoService.translate('userDetail.general.never');
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * Action handlers
   */
  protected onSendInvitation(): void {
    const currentUser = this.user();
    if (!currentUser) return;

    this.userDetailService
      .sendInvitation(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('userDetail.messages.success'),
            detail: this.translocoService.translate('userDetail.messages.invitationSent'),
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: error.message,
          });
        },
      });
  }

  protected onResetPassword(): void {
    const currentUser = this.user();
    if (!currentUser) return;

    this.userDetailService
      .resetPassword(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('userDetail.messages.success'),
            detail: this.translocoService.translate('userDetail.messages.passwordReset'),
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: error.message,
          });
        },
      });
  }

  protected onDisableUser(): void {
    const currentUser = this.user();
    if (!currentUser) return;

    this.userDetailService
      .disableUser(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('userDetail.messages.success'),
            detail: this.translocoService.translate('userDetail.messages.userDisabled'),
          });
          // Reload user to get updated status
          this.loadUser(currentUser.id);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: error.message,
          });
        },
      });
  }

  protected onEnableUser(): void {
    const currentUser = this.user();
    if (!currentUser) return;

    this.userDetailService
      .enableUser(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('userDetail.messages.success'),
            detail: this.translocoService.translate('userDetail.messages.userEnabled'),
          });
          // Reload user to get updated status
          this.loadUser(currentUser.id);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: error.message,
          });
        },
      });
  }

  protected onImpersonate(): void {
    const currentUser = this.user();
    if (!currentUser) return;

    this.userDetailService
      .impersonateUser(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.messageService.add({
            severity: 'info',
            summary: this.translocoService.translate('userDetail.messages.impersonating'),
            detail: this.translocoService.translate('userDetail.messages.impersonatingDetail', {
              name: currentUser.fullName,
            }),
          });
          // Store impersonation token and potentially redirect
          // This is a placeholder - actual implementation depends on auth flow
          console.log('Impersonation token:', result.token);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: error.message,
          });
        },
      });
  }
}
