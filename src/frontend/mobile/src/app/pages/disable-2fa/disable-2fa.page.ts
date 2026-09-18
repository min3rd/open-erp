import { Component, inject, signal } from '@angular/core';
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
  IonMenuButton,
  NavController
} from '@ionic/angular/standalone';
import { AccountService } from '../../core/account.service';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  SharpInputComponent,
  ButtonVariant,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-disable-2fa',
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
    IonMenuButton,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    SharpInputComponent
  ],
  templateUrl: './disable-2fa.page.html'
})
export class Disable2FaPage {
  accountService = inject(AccountService);
  i18n = inject(I18nService);
  navCtrl = inject(NavController);

  readonly buttonVariantDanger = ButtonVariant.DANGER;
  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;

  currentPassword = '';
  code = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  handleDisable() {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.accountService.disable2Fa(this.currentPassword, this.code).subscribe({
      next: () => {
        this.loading.set(false);
        this.navCtrl.navigateBack('/account/security');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }

  cancel() {
    this.navCtrl.navigateBack('/account/security');
  }
}
