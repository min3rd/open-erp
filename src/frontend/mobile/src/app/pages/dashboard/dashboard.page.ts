import { Component, OnInit, computed, inject } from '@angular/core';
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
import { PluginContextService } from '../../core/plugin-context.service';
import {
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  PluginSlotComponent,
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
    BadgeComponent,
    PluginSlotComponent
  ],
  templateUrl: './dashboard.page.html'
})
export class DashboardPage implements OnInit {
  auth = inject(AuthService);
  navCtrl = inject(NavController);
  pluginContext = inject(PluginContextService);

  readonly badgeInfo = ColorVariant.INFO;
  readonly buttonSecondary = ColorVariant.SECONDARY;
  readonly canBrowseCatalog = computed(() => this.auth.hasPermission('catalog:item:read') !== false);

  ngOnInit(): void {
    // Notification contributions are rendered by the plugin slot in the header.
  }

  openPluginPath(path: string) {
    this.pluginContext.navigate(path);
  }

  openCatalog() {
    this.navCtrl.navigateForward(['/settings/catalog']);
  }

  openAccount() {
    this.navCtrl.navigateForward(['/account']);
  }
}
