import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  PinInputComponent,
  ButtonVariant,
  ButtonType
} from '@shared';

@Component({
  selector: 'app-register-personal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent,
    PinInputComponent
  ],
  templateUrl: './register-personal.component.html'
})
export class RegisterPersonalComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;
  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;

  fullName = '';
  email = '';
  phone = '';
  password = '';

  step = signal<'FORM' | 'VERIFY_OTP'>('FORM');
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  handleRegister() {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.registerPersonal({
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('VERIFY_OTP');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  handleVerifyOtp(otpCode: string) {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.verifyEmail({ email: this.email, otpCode }).subscribe({
      next: () => {
        this.loading.set(false);
        alert(this.i18n.t('AUTH_EMAIL_VERIFIED_SUCCESS'));
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }
}
