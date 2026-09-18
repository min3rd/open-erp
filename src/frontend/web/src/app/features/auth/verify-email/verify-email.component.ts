import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  PinInputComponent,
  LanguageSwitcherComponent,
  ButtonVariant
} from '@shared';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    PinInputComponent,
    LanguageSwitcherComponent
  ],
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;

  email = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  resendLoading = signal<boolean>(false);
  resendCountdown = signal<number>(0);
  resendInfo = signal<string | null>(null);

  private countdownTimer?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      if (typeof email === 'string' && email) {
        this.email = email;
      } else {
        this.router.navigateByUrl('/login');
      }
    });
  }

  ngOnDestroy() {
    this.clearCountdown();
  }

  handleVerifyOtp(otpCode: string) {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.verifyEmail({ email: this.email, otp_code: otpCode }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login'], { queryParams: { verified: '1' } });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  handleResendOtp() {
    if (this.resendCountdown() > 0 || this.resendLoading()) return;

    this.resendLoading.set(true);
    this.resendInfo.set(null);
    this.errorMessage.set(null);

    this.auth.resendVerification(this.email).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.resendInfo.set(this.i18n.t('AUTH_VERIFICATION_EMAIL_RESENT'));
        this.startCountdown(60);
      },
      error: (err) => {
        this.resendLoading.set(false);
        if (err.code === 'AUTH_OTP_RESEND_TOO_SOON') {
          const retryAfter = Number(err.params?.retry_after);
          this.startCountdown(retryAfter > 0 ? retryAfter : 60);
        }
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  private startCountdown(seconds: number) {
    this.clearCountdown();
    this.resendCountdown.set(seconds);
    this.countdownTimer = setInterval(() => {
      const next = this.resendCountdown() - 1;
      this.resendCountdown.set(next);
      if (next <= 0) {
        this.clearCountdown();
      }
    }, 1000);
  }

  private clearCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }
}
