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
import { StockNav } from './components/stock-nav';
import { StockHeaderTabs } from './components/stock-header-tabs';
import { StockLayoutService } from './services/stock-layout.service';

@Component({
  selector: 'inventory-stock',
  imports: [CommonModule, RouterOutlet, StockNav, StockHeaderTabs],
  templateUrl: './stock.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stock implements OnDestroy {
  private layoutService = inject(StockLayoutService);

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
