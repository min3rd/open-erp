import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  ButtonType,
  ButtonVariant,
  CompanySize
} from '@shared';

type SlugStatus = 'IDLE' | 'CHECKING' | 'AVAILABLE' | 'TAKEN' | 'INVALID';

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  private destroyRef = inject(DestroyRef);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;
  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
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

  step = signal<1 | 2>(1);
  slugStatus = signal<SlugStatus>('IDLE');
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  slugPreviewUrl(): string {
    const slug = this.tenantSlug.trim() || this.i18n.t('AUTH_SUBDOMAIN_PLACEHOLDER');
    return `https://${slug}.openerp.9ms.io.vn`;
  }

  private slugCheckTrigger = new Subject<string>();

  constructor() {
    this.slugCheckTrigger.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(slug => {
        if (!slug) {
          this.slugStatus.set('IDLE');
          return of(null);
        }
        if (!SLUG_PATTERN.test(slug)) {
          this.slugStatus.set('INVALID');
          return of(null);
        }
        this.slugStatus.set('CHECKING');
        return this.auth.checkSlug(slug).pipe(
          map(res => res.data?.available ?? false),
          catchError(() => {
            this.slugStatus.set('IDLE');
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(available => {
      if (available === null) {
        return;
      }
      this.slugStatus.set(available ? 'AVAILABLE' : 'TAKEN');
    });
  }

  onTenantNameChange(val: string) {
    if (!this.tenantSlug || this.tenantSlug === this.generateSlug(this.tenantName)) {
      const slug = this.generateSlug(val);
      this.tenantSlug = slug;
      this.onSlugChange(slug);
    }
  }

  onSlugChange(val: string) {
    const slug = val.trim();
    this.slugStatus.set('IDLE');
    this.slugCheckTrigger.next(slug);
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

  goToStep2() {
    this.errorMessage.set(null);

    if (!this.adminFullName.trim() || !this.adminEmail.trim() || !this.adminPassword) {
      this.errorMessage.set(this.i18n.t('AUTH_ADMIN_STEP_REQUIRED'));
      return;
    }
    if (!EMAIL_PATTERN.test(this.adminEmail.trim())) {
      this.errorMessage.set(this.i18n.t('AUTH_INVALID_EMAIL'));
      return;
    }
    if (this.adminPassword.length < 8) {
      this.errorMessage.set(this.i18n.t('AUTH_PASSWORD_TOO_SHORT'));
      return;
    }

    this.step.set(2);
  }

  goToStep1() {
    this.errorMessage.set(null);
    this.step.set(1);
  }

  handleBusinessRegister() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.tenantName.trim() || !this.tenantSlug.trim()) {
      this.errorMessage.set(this.i18n.t('AUTH_BUSINESS_STEP_REQUIRED'));
      return;
    }
    if (this.slugStatus() === 'TAKEN') {
      this.errorMessage.set(this.i18n.t('AUTH_TENANT_SLUG_DUPLICATE', { slug: this.tenantSlug }));
      return;
    }
    if (this.slugStatus() === 'CHECKING') {
      this.errorMessage.set(this.i18n.t('AUTH_SLUG_CHECKING'));
      return;
    }
    if (this.slugStatus() === 'INVALID') {
      this.errorMessage.set(this.i18n.t('AUTH_SLUG_INVALID'));
      return;
    }

    this.loading.set(true);

    const payload = {
      tenant: {
        name: this.tenantName,
        slug: this.tenantSlug,
        tax_code: this.taxCode,
        company_size: this.companySize,
        currency: 'VND'
      },
      admin: {
        full_name: this.adminFullName,
        email: this.adminEmail,
        password: this.adminPassword
      }
    };

    this.auth.registerBusiness(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.i18n.t('AUTH_BUSINESS_REGISTER_SUCCESS'));
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }
}
