import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  NavController
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  PinInputComponent,
  LanguageSwitcherComponent,
  ThemeSwitcherComponent,
  ButtonVariant,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-two-factor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent,
    PinInputComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent
  ],
  templateUrl: './two-factor.page.html'
})
export class TwoFactorPage implements OnInit {
  private auth = inject(AuthService);
  private i18n = inject(I18nService);
  private navCtrl = inject(NavController);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;

  preAuthToken = signal<string>('');
  backupCodeInput = '';
  useBackupCode = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    const token = this.auth.getPreAuthToken();
    if (!token) {
      this.navCtrl.navigateRoot('/login', { animationDirection: 'back', replaceUrl: true });
      return;
    }
    this.preAuthToken.set(token);
  }

  handle2FaComplete(code: string) {
    this.submit2Fa(code);
  }

  handleBackupCodeSubmit() {
    if (!this.backupCodeInput.trim()) return;
    this.submit2Fa(this.backupCodeInput.trim());
  }

  private submit2Fa(code: string) {
    const token = this.preAuthToken();
    if (!token) {
      this.navCtrl.navigateRoot('/login', { animationDirection: 'back', replaceUrl: true });
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.verifyLogin2Fa({ code, pre_auth_token: token }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data.requires_tenant_selection) {
          this.auth.savePreAuth(res.data.pre_auth_token || token, res.data.tenants || []);
          this.navCtrl.navigateForward(['/select-tenant']);
        } else {
          this.navCtrl.navigateRoot('/dashboard', { animationDirection: 'forward', replaceUrl: true });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
        if (err.code === 'AUTH_2FA_ATTEMPTS_EXCEEDED') {
          this.auth.clearPreAuth();
          this.navCtrl.navigateRoot('/login', { animationDirection: 'back', replaceUrl: true });
        }
      }
    });
  }
}
