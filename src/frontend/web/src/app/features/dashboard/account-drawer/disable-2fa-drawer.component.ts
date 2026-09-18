import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  DrawerComponent,
  SharpButtonComponent,
  SharpInputComponent,
  ButtonVariant,
  ButtonType
} from '@shared';

@Component({
  selector: 'app-disable-2fa-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateDirective,
    TranslatePipe,
    DrawerComponent,
    SharpButtonComponent,
    SharpInputComponent
  ],
  templateUrl: './disable-2fa-drawer.component.html'
})
export class Disable2FaDrawerComponent {
  accountService = inject(AccountService);
  i18n = inject(I18nService);
  private router = inject(Router);

  readonly buttonTypeSubmit = ButtonType.SUBMIT;
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
        this.onClose();
      },
      error: (err: any) => {
        this.loading.set(false);
        this.errorMessage.set(this.i18n.t(err.code, err.params));
      }
    });
  }

  onClose() {
    this.router.navigate(['/account/security']);
  }
}
