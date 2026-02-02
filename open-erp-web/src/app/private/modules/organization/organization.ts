import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrganizationNav } from './components/organization-nav';
import { OrganizationHeaderTabs } from './components/organization-header-tabs';
import { OrganizationLayoutService } from './services/organization-layout.service';

@Component({
  selector: 'module-organization',
  imports: [CommonModule, RouterOutlet, OrganizationNav, OrganizationHeaderTabs],
  templateUrl: './organization.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Organization implements OnDestroy {
  private layoutService = inject(OrganizationLayoutService);

  isMobile = signal(false);
  navMode = this.layoutService.navMode;

  private resizeHandler = () => this.checkMobileView();

  constructor() {
    // Initialize mobile detection
    this.checkMobileView();

    // Set up resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler);
    }

    // Update layout service with mobile state
    effect(() => {
      this.layoutService.setIsMobile(this.isMobile());
    });
  }

  ngOnDestroy(): void {
    // Clean up resize listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  private checkMobileView(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 1024);
    }
  }
}

