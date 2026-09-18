import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  route = inject(ActivatedRoute);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;

  token = '';
  newPassword = '';
  confirmPassword = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
      }
    });
  }

  handleResetPassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set(this.i18n.t('AUTH_PASSWORD_MISMATCH'));
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.loading.set(true);

    this.auth.resetPassword({
      token: this.token,
      new_password: this.newPassword
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.i18n.t('AUTH_PASSWORD_RESET_SUCCESS'));
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }
}
