import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  ImpersonationSessionData,
  PlatformTenant,
  SharpButtonComponent,
  SharpInputComponent,
  SharpTextareaComponent,
  TranslatePipe
} from '@shared';

import { PlatformService } from '../../../core/services/platform.service';

@Component({
  selector: 'app-impersonate-confirm-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    SharpInputComponent,
    SharpTextareaComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './impersonate-confirm-drawer.component.html'
})
export class ImpersonateConfirmDrawerComponent {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  tenant = input<PlatformTenant | null>(null);

  close = output<void>();
  started = output<{ data: ImpersonationSessionData; ticket: string }>();

  readonly targetUserId = signal<string>('');
  readonly supportTicket = signal<string>('');
  readonly reason = signal<string>('');
  readonly password = signal<string>('');
  readonly agreed = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.targetUserId.set('');
        this.supportTicket.set('');
        this.reason.set('');
        this.password.set('');
        this.agreed.set(false);
        this.errorText.set('');
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  start() {
    const current = this.tenant();
    if (!current) {
      return;
    }
    if (!this.supportTicket().trim() || !this.reason().trim() || !this.password()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    if (!this.agreed()) {
      this.errorText.set(this.i18n.t('PLATFORM_IMPERSONATE_AGREE_REQUIRED'));
      return;
    }
    this.saving.set(true);
    this.platform
      .impersonate(current.tenant_id, {
        target_user_id: this.targetUserId().trim() || undefined,
        support_ticket: this.supportTicket().trim(),
        reason: this.reason().trim(),
        confirm_password: this.password()
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.started.emit({ data: res.data, ticket: this.supportTicket().trim() });
        },
        error: (err) => {
          this.saving.set(false);
          this.showError(err);
        }
      });
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
