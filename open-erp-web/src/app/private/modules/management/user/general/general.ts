import { ChangeDetectionStrategy, Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { SkeletonModule } from 'primeng/skeleton';

// Services and types
import { UserDetailService, UserDetail } from '../services/user-detail.service';

@Component({
  selector: 'management-user-general',
  imports: [CommonModule, TranslocoModule, SkeletonModule],
  templateUrl: './general.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class General implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private userDetailService = inject(UserDetailService);
  private destroy$ = new Subject<void>();

  protected readonly user = signal<UserDetail | null>(null);
  protected readonly isLoading = signal(false);

  ngOnInit(): void {
    // Get user from parent route resolver
    this.route.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['userDetail']) {
        this.user.set(data['userDetail']);
      }
    });

    // Subscribe to user updates from service
    this.userDetailService.userUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedUser) => {
        if (updatedUser && updatedUser.id === this.user()?.id) {
          this.user.set(updatedUser);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

