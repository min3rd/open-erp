import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService, TopProgressBarComponent, ContextMenuComponent } from '@shared';
import { AuthService } from './core/services/auth.service';
import { ImpersonationBannerComponent } from './features/platform/impersonation-banner/impersonation-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ImpersonationBannerComponent, TopProgressBarComponent, ContextMenuComponent],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('web');

  private theme = inject(ThemeService);
  private auth = inject(AuthService);

  constructor() {
    this.theme.init();
    // Apply the saved appearance (user prefs + tenant default) once per auth transition.
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.theme.loadPreferences();
      }
    });
  }
}
