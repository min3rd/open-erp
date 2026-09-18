import { Component, OnInit, inject, signal } from '@angular/core';
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
  PinInputComponent,
  ButtonVariant,
  ButtonSize,
  TwoFactorSetupData,
  TwoFactorEnableData
} from '@shared';

@Component({
  selector: 'app-setup-2fa',
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
    PinInputComponent
  ],
  templateUrl: './setup-2fa.page.html'
})
export class Setup2FaPage implements OnInit {
  accountService = inject(AccountService);
  i18n = inject(I18nService);
  navCtrl = inject(NavController);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
  readonly buttonSizeSm = ButtonSize.SM;

  loadingSetup = signal<boolean>(false);
  loadingEnable = signal<boolean>(false);
  setupData = signal<TwoFactorSetupData | null>(null);
  enabledData = signal<TwoFactorEnableData | null>(null);
  errorMessage = signal<string | null>(null);
  otpCode = signal<string>('');
  copiedField = signal<'secret' | 'uri' | 'codes' | null>(null);

  ngOnInit() {
    this.initSetup();
  }

  initSetup() {
    this.errorMessage.set(null);
    this.loadingSetup.set(true);

    this.accountService.setup2Fa().subscribe({
      next: (res) => {
        this.loadingSetup.set(false);
        this.setupData.set(res.data);
      },
      error: (err) => {
        this.loadingSetup.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  handleEnable(code: string) {
    if (!code || code.length !== 6) return;

    this.errorMessage.set(null);
    this.loadingEnable.set(true);

    this.accountService.enable2Fa(code).subscribe({
      next: (res) => {
        this.loadingEnable.set(false);
        this.enabledData.set(res.data);
      },
      error: (err) => {
        this.loadingEnable.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
        this.otpCode.set('');
      }
    });
  }

  async copyText(text: string, field: 'secret' | 'uri' | 'codes') {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    this.copiedField.set(field);
    setTimeout(() => this.copiedField.set(null), 2000);
  }

  copySecret() {
    const data = this.setupData();
    if (data) this.copyText(data.secret_key, 'secret');
  }

  copyUri() {
    const data = this.setupData();
    if (data) this.copyText(data.qr_code_uri, 'uri');
  }

  copyBackupCodes() {
    const codes = this.enabledData()?.backup_codes || [];
    if (codes.length) this.copyText(codes.join('\n'), 'codes');
  }

  finish() {
    this.navCtrl.navigateBack('/account/security');
  }
}
