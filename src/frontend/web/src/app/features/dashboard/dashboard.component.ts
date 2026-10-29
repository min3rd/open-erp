import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PluginContextService } from '../../core/services/plugin-context.service';
import { AccountDrawerComponent } from './account-drawer/account-drawer.component';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  TopbarComponent,
  PluginSlotComponent,
  ColorVariant,
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
    TopbarComponent,
    PluginSlotComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  pluginContext = inject(PluginContextService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly badgeVariantSuccess = ColorVariant.SUCCESS;

  ngOnInit(): void {
    // Notification contributions are rendered by the plugin slot in the topbar.
  }

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

  openAccount() {
    this.router.navigateByUrl('/account/detail');
  }

  closeAccount() {
    this.router.navigateByUrl('/dashboard');
  }
}
