import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  NavController
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  LanguageSwitcherComponent,
  ThemeSwitcherComponent,
  ButtonType,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent
  ],
  templateUrl: './login.page.html'
})
export class LoginPage {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  navCtrl = inject(NavController);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;

  email = '';
  password = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  handleLogin() {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data.requires_2fa) {
          this.auth.savePreAuth(res.data.pre_auth_token || '');
          this.navCtrl.navigateForward(['/auth/2fa']);
        } else if (res.data.requires_tenant_selection) {
          this.auth.savePreAuth(res.data.pre_auth_token || '', res.data.tenants || []);
          this.navCtrl.navigateForward(['/select-tenant']);
        } else {
          this.navCtrl.navigateRoot('/dashboard', { animationDirection: 'forward', replaceUrl: true });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }
}
