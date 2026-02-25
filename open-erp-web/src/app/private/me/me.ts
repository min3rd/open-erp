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
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { MeService } from '../../../core/services/me-service';
import type { MeProfile } from './me.types';

@Component({
  selector: 'app-me',
  imports: [
    CommonModule,
    RouterOutlet,
    TranslocoModule,
    AvatarModule,
    SkeletonModule,
  ],
  templateUrl: './me.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Me implements OnInit, OnDestroy {
  private router = inject(Router);
  private meService = inject(MeService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  readonly profile = signal<MeProfile | null>(null);
  readonly isLoading = signal(true);
  activeTab = signal(0);

  get tabs() {
    return [
      { label: this.translocoService.translate('me.tabs.profile'), route: '/me', index: 0 },
      { label: this.translocoService.translate('me.tabs.security'), route: '/me/security', index: 1 },
      { label: this.translocoService.translate('me.tabs.settings'), route: '/me/settings', index: 2 },
    ];
  }

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

    // Apply user settings (theme + language) on navigation to /me
    this.meService
      .getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          if (settings.language) {
            this.translocoService.setActiveLang(settings.language);
            localStorage.setItem('app.lang', settings.language);
          }
          if (settings.theme) {
            this.applyTheme(settings.theme);
          }
        },
        error: () => {
          // Silently ignore — settings may not be configured yet
        },
      });
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('app.theme', 'dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      localStorage.setItem('app.theme', 'light');
    } else {
      localStorage.setItem('app.theme', 'auto');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
    }
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
