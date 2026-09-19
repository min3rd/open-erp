import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@shared';
import { ImpersonationBannerComponent } from './features/platform/impersonation-banner/impersonation-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ImpersonationBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('web');

  private theme = inject(ThemeService);

  constructor() {
    this.theme.init();
  }
}
