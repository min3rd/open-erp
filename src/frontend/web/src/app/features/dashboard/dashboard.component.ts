import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AccountDrawerComponent } from './account-drawer/account-drawer.component';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  TopbarComponent,
  ButtonVariant,
  ButtonSize,
  BadgeVariant
} from '@shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AccountDrawerComponent,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent,
    TopbarComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly buttonVariantGhost = ButtonVariant.GHOST;
  readonly buttonSizeSm = ButtonSize.SM;
  readonly badgeVariantInfo = BadgeVariant.INFO;
  readonly badgeVariantSuccess = BadgeVariant.SUCCESS;

  readonly deniedNotice = computed(() => {
    const denied = this.route.snapshot.queryParamMap.get('denied');
    return denied ? this.i18n.t(denied) : '';
  });

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly isAccountDrawerOpen = computed(() => this.currentUrl().startsWith('/account'));

  setLang(lang: 'vi' | 'en') {
    this.i18n.setLanguage(lang);
  }

  openAccount() {
    this.router.navigateByUrl('/account/detail');
  }

  closeAccount() {
    this.router.navigateByUrl('/dashboard');
  }
}
