import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  LanguageSwitcherComponent,
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
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent,
    LanguageSwitcherComponent
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;

  email = '';
  password = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  verifiedNotice = signal<boolean>(false);

  private returnUrl = '/dashboard';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const url = params['returnUrl'];
      if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
        this.returnUrl = url;
      }
      this.verifiedNotice.set(params['verified'] === '1');
    });
  }

  handleLogin() {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data.requires_2fa) {
          this.auth.storePreAuth(res.data.pre_auth_token || '');
          this.router.navigate(['/auth/2fa'], { queryParams: { returnUrl: this.returnUrl } });
        } else if (res.data.requires_tenant_selection) {
          this.auth.storePreAuth(res.data.pre_auth_token || '', res.data.tenants || []);
          this.router.navigateByUrl('/select-tenant');
        } else if (this.auth.mustChangePassword()) {
          this.router.navigateByUrl('/platform/change-password');
        } else {
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }
}
