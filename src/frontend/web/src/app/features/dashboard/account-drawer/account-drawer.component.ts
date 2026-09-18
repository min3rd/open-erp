import { Component, computed, inject, input, output } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { 
  TranslatePipe,
  DrawerComponent,
  SharpButtonComponent,
  ButtonVariant
} from '@shared';

@Component({
  selector: 'app-account-drawer',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    DrawerComponent,
    SharpButtonComponent
  ],
  templateUrl: './account-drawer.component.html'
})
export class AccountDrawerComponent {
  private router = inject(Router);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;

  isOpen = input<boolean>(false);
  close = output<void>();

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly isStackedRouteActive = computed(() => this.currentUrl().startsWith('/account/security/2fa'));

  onClose() {
    this.close.emit();
  }
}
