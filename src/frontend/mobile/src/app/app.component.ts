import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from '@shared';
import { AuthService } from './core/auth.service';
import { MobileMenuComponent } from './core/components/mobile-menu/mobile-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, MobileMenuComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  auth = inject(AuthService);
  private theme = inject(ThemeService);

  constructor() {
    this.theme.init();
  }
}
