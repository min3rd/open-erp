import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  TranslatePipe,
  PinInputComponent,
  LanguageSwitcherComponent,
  ThemeSwitcherComponent,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    TranslatePipe,
    PinInputComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent
  ],
  templateUrl: './verify-email.page.html'
})
export class VerifyEmailPage implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private i18n = inject(I18nService);
  private navCtrl = inject(NavController);
  private route = inject(ActivatedRoute);

  email = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  statusMessage = signal<string | null>(null);
  resendCooldown = signal<number>(0);

  private countdownTimer?: ReturnType<typeof setInterval>;
  private redirectTimer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    const email = this.route.snapshot.queryParamMap.get('email') || '';
    if (!email) {
      this.navCtrl.navigateRoot('/login', { animationDirection: 'back', replaceUrl: true });
      return;
    }
    this.email.set(email);
    this.startCooldown();
  }

  handleVerifyOtp(otpCode: string) {
    this.errorMessage.set(null);
    this.statusMessage.set(null);
    this.loading.set(true);

    this.auth.verifyEmail(this.email(), otpCode).subscribe({
      next: () => {
        this.loading.set(false);
        this.statusMessage.set(this.i18n.t('AUTH_EMAIL_VERIFIED_SUCCESS'));
        this.redirectTimer = setTimeout(
          () => this.navCtrl.navigateRoot('/login', { animationDirection: 'back', replaceUrl: true }),
          1500
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }

  handleResend() {
    if (this.resendCooldown() > 0 || this.loading()) return;

    this.errorMessage.set(null);
    this.statusMessage.set(null);

    this.auth.resendVerification(this.email()).subscribe({
      next: () => {
        this.statusMessage.set(this.i18n.t('AUTH_VERIFICATION_EMAIL_RESENT'));
        this.startCooldown();
      },
      error: (err) => {
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }

  private startCooldown() {
    this.resendCooldown.set(60);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      const next = this.resendCooldown() - 1;
      this.resendCooldown.set(next);
      if (next <= 0 && this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = undefined;
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
  }
}
