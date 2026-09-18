import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toDataURL } from 'qrcode';
import { AccountService } from '../../../core/services/account.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  DrawerComponent,
  SharpButtonComponent,
  PinInputComponent,
  ButtonVariant,
  TwoFactorSetupData,
  TwoFactorEnableData,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-setup-2fa-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateDirective,
    TranslatePipe,
    DrawerComponent,
    SharpButtonComponent,
    PinInputComponent
  ],
  templateUrl: './setup-2fa-drawer.component.html'
})
export class Setup2FaDrawerComponent implements OnInit {
  accountService = inject(AccountService);
  i18n = inject(I18nService);
  private router = inject(Router);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;

  stage = signal<'SETUP' | 'CODES'>('SETUP');
  loadingSetup = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);
  setupData = signal<TwoFactorSetupData | null>(null);
  enableData = signal<TwoFactorEnableData | null>(null);
  qrDataUrl = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  copiedSecret = signal<boolean>(false);
  copiedCodes = signal<boolean>(false);

  ngOnInit() {
    this.initSetup();
  }

  initSetup() {
    this.loadingSetup.set(true);

    this.accountService.setup2Fa().subscribe({
      next: (res) => {
        this.loadingSetup.set(false);
        this.setupData.set(res.data);
        this.renderQr(res.data.qr_code_uri);
      },
      error: (err) => {
        this.loadingSetup.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }

  handleEnable2Fa(code: string) {
    this.errorMessage.set(null);
    this.loadingSubmit.set(true);

    this.accountService.enable2Fa(code).subscribe({
      next: (res) => {
        this.loadingSubmit.set(false);
        this.enableData.set(res.data);
        this.stage.set('CODES');
      },
      error: (err) => {
        this.loadingSubmit.set(false);
        this.errorMessage.set(apiMessage(this.i18n, err));
      }
    });
  }

  copySecret() {
    const secret = this.setupData()?.secret_key;
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(() => {
      this.copiedSecret.set(true);
      setTimeout(() => this.copiedSecret.set(false), 2000);
    });
  }

  copyBackupCodes() {
    const codes = this.enableData()?.backup_codes;
    if (!codes?.length) return;
    navigator.clipboard.writeText(codes.join('\n')).then(() => {
      this.copiedCodes.set(true);
      setTimeout(() => this.copiedCodes.set(false), 2000);
    });
  }

  downloadBackupCodes() {
    const codes = this.enableData()?.backup_codes;
    if (!codes?.length) return;

    const blob = new Blob([codes.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'openerp-2fa-backup-codes.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  finish() {
    this.router.navigate(['/account/security']);
  }

  onClose() {
    this.router.navigate(['/account/security']);
  }

  private renderQr(uri: string) {
    toDataURL(uri, { width: 140, margin: 1 })
      .then(dataUrl => this.qrDataUrl.set(dataUrl))
      .catch(() => this.qrDataUrl.set(null));
  }
}
