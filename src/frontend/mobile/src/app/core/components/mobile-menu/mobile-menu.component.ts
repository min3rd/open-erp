import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  personOutline,
  shieldCheckmarkOutline,
  desktopOutline
} from 'ionicons/icons';
import { AuthService } from '../../auth.service';
import {
  BadgeComponent,
  ColorVariant,
  LanguageSwitcherComponent,
  SharpButtonComponent,
  ThemeSwitcherComponent,
  TranslatePipe
} from '@shared';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    BadgeComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './mobile-menu.component.html'
})
export class MobileMenuComponent {
  private menuCtrl = inject(MenuController);
  private auth = inject(AuthService);

  tenantName = input<string>('');
  role = input<string>('');
  userName = input<string>('');
  userEmail = input<string>('');

  readonly colorInfo = ColorVariant.INFO;
  readonly colorDanger = ColorVariant.DANGER;

  displayName = computed(() => this.userName() || this.userEmail());
  userInitial = computed(() => (this.userName() || this.userEmail() || 'U').charAt(0).toUpperCase());

  constructor() {
    addIcons({ homeOutline, personOutline, shieldCheckmarkOutline, desktopOutline });
  }

  close(): void {
    this.menuCtrl.close();
  }

  onLogout(): void {
    this.close();
    this.auth.logout();
  }
}
