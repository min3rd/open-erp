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
  CompanySize
} from '@shared';

@Component({
  selector: 'app-register-business',
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
  templateUrl: './register-business.component.html'
})
export class RegisterBusinessComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;
  readonly companySizeMicro = CompanySize.MICRO;
  readonly companySizeSmall = CompanySize.SMALL;
  readonly companySizeMedium = CompanySize.MEDIUM;
  readonly companySizeEnterprise = CompanySize.ENTERPRISE;

  tenantName = '';
  tenantSlug = '';
  taxCode = '';
  companySize: string = CompanySize.SMALL;

  adminFullName = '';
  adminEmail = '';
  adminPassword = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onTenantNameChange(val: string) {
    if (!this.tenantSlug || this.tenantSlug === this.generateSlug(this.tenantName)) {
      this.tenantSlug = this.generateSlug(val);
    }
  }

  generateSlug(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  handleBusinessRegister() {
    this.errorMessage.set(null);
    this.loading.set(true);

    const payload = {
      tenant: {
        name: this.tenantName,
        slug: this.tenantSlug,
        taxCode: this.taxCode,
        companySize: this.companySize,
        currency: 'VND'
      },
      admin: {
        fullName: this.adminFullName,
        email: this.adminEmail,
        password: this.adminPassword
      }
    };

    this.auth.registerBusiness(payload).subscribe({
      next: () => {
        this.loading.set(false);
        alert(this.i18n.t('AUTH_BUSINESS_REGISTER_SUCCESS'));
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }
}
