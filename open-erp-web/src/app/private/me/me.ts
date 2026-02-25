import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { MeService, MeProfile } from '../../core/services/me-service';

@Component({
  selector: 'app-me',
  imports: [
    CommonModule,
    RouterOutlet,
    AvatarModule,
    SkeletonModule,
  ],
  templateUrl: './me.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Me implements OnInit, OnDestroy {
  private router = inject(Router);
  private meService = inject(MeService);
  private destroy$ = new Subject<void>();

  readonly profile = signal<MeProfile | null>(null);
  readonly isLoading = signal(true);
  activeTab = signal(0);

  readonly tabs = [
    { label: 'Thông tin chung', route: '/me', index: 0 },
    { label: 'Bảo mật', route: '/me/security', index: 1 },
    { label: 'Cài đặt', route: '/me/settings', index: 2 },
  ];

  ngOnInit(): void {
    this.setActiveTabFromRoute(this.router.url);

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((e) => {
        this.setActiveTabFromRoute((e as NavigationEnd).url);
      });

    this.meService
      .getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private setActiveTabFromRoute(url: string): void {
    if (url.includes('/me/security')) {
      this.activeTab.set(1);
    } else if (url.includes('/me/settings')) {
      this.activeTab.set(2);
    } else {
      this.activeTab.set(0);
    }
  }

  navigateToTab(index: number): void {
    this.activeTab.set(index);
    this.router.navigate([this.tabs[index].route]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
