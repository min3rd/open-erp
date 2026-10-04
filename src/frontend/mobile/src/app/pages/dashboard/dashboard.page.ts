import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  NavController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import {
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  ColorVariant,
} from '@shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent
  ],
  templateUrl: './dashboard.page.html'
})
export class DashboardPage {
  auth = inject(AuthService);
  navCtrl = inject(NavController);

  readonly badgeInfo = ColorVariant.INFO;

  openAccount() {
    this.navCtrl.navigateForward(['/account']);
  }
}
