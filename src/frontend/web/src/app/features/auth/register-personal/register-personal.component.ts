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
  ButtonType,
  apiMessage
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
    SharpInputComponent
  ],
  templateUrl: './register-personal.component.html'
})
export class RegisterPersonalComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;

  fullName = '';
  email = '';
  phone = '';
  password = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  handleRegister() {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.registerPersonal({
      full_name: this.fullName,
      email: this.email,
      phone: this.phone,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/verify-email'], { queryParams: { email: this.email } });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }
}
