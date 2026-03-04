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
import { WmsNav } from './components/wms-nav';
import { WmsHeaderTabs } from './components/wms-header-tabs';
import { WmsLayoutService } from './services/wms-layout.service';

@Component({
  selector: 'module-wms',
  imports: [CommonModule, RouterOutlet, WmsNav, WmsHeaderTabs],
  templateUrl: './wms.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Wms implements OnDestroy {
  private layoutService = inject(WmsLayoutService);

  isMobile = signal(false);
  navMode = this.layoutService.navMode;

  private resizeHandler = () => this.checkMobileView();

  constructor() {
    this.checkMobileView();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler);
    }

    effect(() => {
      this.layoutService.setIsMobile(this.isMobile());
    });
  }

  ngOnDestroy(): void {
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
