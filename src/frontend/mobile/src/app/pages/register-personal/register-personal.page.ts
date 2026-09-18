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
  NavController
} from '@ionic/angular/standalone';
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
  apiMessage
} from '@shared';

@Component({
  selector: 'app-register-personal',
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
  templateUrl: './register-personal.page.html'
})
export class RegisterPersonalPage {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  navCtrl = inject(NavController);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;

  fullName = '';
  email = '';
  phone = '';
  password = '';

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  handleRegister() {
    this.errorMessage.set(null);
    this.loading.set(true);

    this.auth.registerPersonal({
      full_name: this.fullName,
      email: this.email,
      phone: this.phone || undefined,
      password: this.password
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.navCtrl.navigateForward(['/verify-email'], {
          queryParams: { email: this.email }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }
}
