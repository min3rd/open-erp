import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  LanguageSwitcherComponent,
  ButtonVariant,
  BadgeVariant,
  TenantInfo
} from '@shared';

@Component({
  selector: 'app-select-tenant',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent,
    LanguageSwitcherComponent
  ],
  templateUrl: './select-tenant.component.html'
})
export class SelectTenantComponent implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
  readonly badgeVariantInfo = BadgeVariant.INFO;

  tenants = signal<TenantInfo[]>([]);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  private preAuthToken = '';

  ngOnInit() {
    this.preAuthToken = this.auth.getPreAuthToken();
    const tenants = this.auth.getPreAuthTenants();

    if (!this.preAuthToken || !tenants.length) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.tenants.set(tenants);
  }

  handleBack() {
    this.auth.clearPreAuth();
    this.router.navigateByUrl('/login');
  }

  handleSelectTenant(tenantId: string) {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.selectTenant({ tenant_id: tenantId, pre_auth_token: this.preAuthToken }).subscribe({
      next: () => {
        this.loading.set(false);
        this.auth.clearPreAuth();
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }
}
