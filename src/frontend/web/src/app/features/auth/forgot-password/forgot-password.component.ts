import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  ButtonType,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent
  ],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;

  email = '';
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  handleForgotPassword() {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.i18n.t('AUTH_FORGOT_PASSWORD_REQUESTED'));
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }
}
