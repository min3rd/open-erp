import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../core/services/account.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  DrawerComponent,
  SharpButtonComponent,
  PinInputComponent,
  ButtonVariant,
  TwoFactorSetupData
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

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;

  isOpen = input<boolean>(false);
  close = output<void>();
  enabledSuccess = output<void>();

  loadingSetup = signal<boolean>(false);
  loadingSubmit = signal<boolean>(false);
  setupData = signal<TwoFactorSetupData | null>(null);
  errorMessage = signal<string | null>(null);
  copied = signal<boolean>(false);

  ngOnInit() {
    if (this.isOpen()) {
      this.initSetup();
    }
  }

  initSetup() {
    this.errorMessage.set(null);
    this.loadingSetup.set(true);

    this.accountService.setup2Fa().subscribe({
      next: (res: any) => {
        this.loadingSetup.set(false);
        this.setupData.set(res.data);
      },
      error: (err: any) => {
        this.loadingSetup.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  handleEnable2Fa(code: string) {
    this.errorMessage.set(null);
    this.loadingSubmit.set(true);

    this.accountService.enable2Fa(code).subscribe({
      next: () => {
        this.loadingSubmit.set(false);
        alert(this.i18n.t('ACCOUNT_2FA_ENABLED_SUCCESS'));
        this.enabledSuccess.emit();
        this.close.emit();
      },
      error: (err: any) => {
        this.loadingSubmit.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  copyBackupCodes() {
    if (!this.setupData()) return;
    const text = this.setupData()!.backup_codes.join('\n');
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  onClose() {
    this.close.emit();
  }
}
