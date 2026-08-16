import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService, ThemeService, LanguageService, AvatarComponent } from '@open-erp/shared';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, TranslocoModule, AvatarComponent],
  templateUrl: './profile.page.html'
})
export class ProfilePage {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  langService = inject(LanguageService);

  logout(): void {
    this.authService.logout('/login');
  }
}
