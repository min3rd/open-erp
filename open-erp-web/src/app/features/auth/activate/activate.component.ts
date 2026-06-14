import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { ButtonComponent, IconComponent, AlertComponent } from '@open-erp/shared-ui';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-activate',
  imports: [
    TranslocoModule,
    ButtonComponent,
    IconComponent,
    AlertComponent,
  ],
  templateUrl: './activate.component.html',
})
export class ActivateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);
  private authService = inject(AuthService);

  isLoading = signal<boolean>(true);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  ngOnInit() {
    // 1. Read token from query parameters
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (!token) {
        this.isLoading.set(false);
        this.errorMessage.set(this.translocoService.translate('auth.invalid_activation_token'));
        return;
      }
      this.activateAccount(token);
    });
  }

  activateAccount(token: string) {
    this.authService.activate(token).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.success) {
          const msgKey = res.messageKey || 'auth.activation_success';
          this.successMessage.set(this.translocoService.translate(msgKey));
          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.errorMessage.set(this.translocoService.translate('auth.invalid_activation_token'));
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errPayload = err.error || {};
        const msgKey = errPayload.error?.messageKey || 'auth.invalid_activation_token';
        this.errorMessage.set(this.translocoService.translate(msgKey));
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
