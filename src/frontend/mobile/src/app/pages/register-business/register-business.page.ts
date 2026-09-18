import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  NavController
} from '@ionic/angular/standalone';
import { Subject, Subscription, catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  LanguageSwitcherComponent,
  ThemeSwitcherComponent,
  ButtonType,
  CompanySize,
  apiMessage
} from '@shared';

type SlugCheckState = 'idle' | 'checking' | 'available' | 'taken' | 'error';

@Component({
  selector: 'app-register-business',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent
  ],
  templateUrl: './register-business.page.html'
})
export class RegisterBusinessPage implements OnDestroy {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  navCtrl = inject(NavController);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;
  readonly companySizeMicro = CompanySize.MICRO;
  readonly companySizeSmall = CompanySize.SMALL;
  readonly companySizeMedium = CompanySize.MEDIUM;
  readonly companySizeEnterprise = CompanySize.ENTERPRISE;

  tenantName = '';
  tenantSlug = '';
  taxCode = '';
  companySize: string = CompanySize.SMALL;
  currency = 'VND';

  adminFullName = '';
  adminEmail = '';
  adminPassword = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  slugStatus = signal<SlugCheckState>('idle');
  slugBlocked = computed(() => this.slugStatus() === 'taken' || this.slugStatus() === 'checking');

  private slugCheck$ = new Subject<string>();
  private slugCheckSub?: Subscription;
  private redirectTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.slugCheckSub = this.slugCheck$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((slug) => {
        if (!slug) {
          return of<SlugCheckState>('idle');
        }
        this.slugStatus.set('checking');
        return this.auth.checkSlug(slug).pipe(
          map((res): SlugCheckState => (res.data?.available ? 'available' : 'taken')),
          catchError(() => of<SlugCheckState>('error'))
        );
      })
    ).subscribe((status) => this.slugStatus.set(status));
  }

  onTenantNameChange(val: string) {
    if (!this.tenantSlug || this.tenantSlug === this.generateSlug(this.tenantName)) {
      this.tenantSlug = this.generateSlug(val);
      this.slugCheck$.next(this.tenantSlug);
    }
  }

  onSlugChange(val: string) {
    this.tenantSlug = this.generateSlug(val);
    this.errorMessage.set(null);
    this.slugCheck$.next(this.tenantSlug);
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
    this.successMessage.set(null);

    if (this.slugStatus() === 'taken') {
      this.errorMessage.set(this.i18n.t('AUTH_TENANT_SLUG_DUPLICATE', { slug: this.tenantSlug }));
      return;
    }
    if (this.slugStatus() === 'checking') {
      this.errorMessage.set(this.i18n.t('AUTH_TENANT_SLUG_CHECKING'));
      return;
    }

    this.loading.set(true);

    this.auth.registerBusiness({
      admin: {
        full_name: this.adminFullName,
        email: this.adminEmail,
        password: this.adminPassword
      },
      tenant: {
        name: this.tenantName,
        slug: this.tenantSlug,
        tax_code: this.taxCode || undefined,
        company_size: this.companySize,
        currency: this.currency
      }
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(this.i18n.t('AUTH_BUSINESS_REGISTER_SUCCESS'));
        this.redirectTimer = setTimeout(
          () => this.navCtrl.navigateRoot('/login', { animationDirection: 'back', replaceUrl: true }),
          1500
        );
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.code === 'AUTH_TENANT_SLUG_DUPLICATE') {
          this.slugStatus.set('taken');
        }
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }

  ngOnDestroy() {
    this.slugCheckSub?.unsubscribe();
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
  }
}
