import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VerticalNavigation } from '../../components/navigations/vertical-navigation/vertical-navigation';
import { QuickChat } from '../../components/quick-chat/quick-chat';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '../../services/layout-service';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'layout-vertical',
  imports: [CommonModule, RouterOutlet, VerticalNavigation, QuickChat, ButtonModule, TranslocoModule],
  templateUrl: './vertical.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class Vertical implements OnDestroy {
  private layoutService = inject(LayoutService);

  sidebarVisible = this.layoutService.sidebarVisible;
  quickChatVisible = this.layoutService.quickChatVisible;

  // Check if mobile view based on window width
  isMobile = signal(false);

  private resizeHandler = () => this.checkMobileView();

  constructor() {
    // Initialize mobile detection
    this.checkMobileView();

    // Set up resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler);
    }

    // Auto-hide sidebar on mobile, show on desktop
    effect(() => {
      if (this.isMobile()) {
        this.layoutService.setSidebarVisible(false);
        this.layoutService.setQuickChatVisible(false);
      } else {
        this.layoutService.setSidebarVisible(true);
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up resize listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  toggleQuickChat(): void {
    this.layoutService.toggleQuickChat();
  }

  onEscapeKey(): void {
    // Close sidebar or quick chat on Escape key
    if (this.isMobile()) {
      if (this.sidebarVisible()) {
        this.layoutService.setSidebarVisible(false);
      } else if (this.quickChatVisible()) {
        this.layoutService.setQuickChatVisible(false);
      }
    }
  }

  private checkMobileView(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 1024);
    }
  }
}
