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
import { ManagementNav } from './components/management-nav';
import { ManagementHeaderTabs } from './components/management-header-tabs';
import { ManagementLayoutService } from './services/management-layout.service';

@Component({
  selector: 'module-management',
  imports: [CommonModule, RouterOutlet, ManagementNav, ManagementHeaderTabs],
  templateUrl: './management.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Management implements OnDestroy {
  private layoutService = inject(ManagementLayoutService);

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
