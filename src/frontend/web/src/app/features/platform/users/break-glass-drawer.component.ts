import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  BreakGlassAction,
  DrawerComponent,
  I18nService,
  PlatformUser,
  SharpButtonComponent,
  SharpInputComponent,
  SharpTextareaComponent,
  TranslatePipe
} from '@shared';

import { PlatformService } from '../../../core/services/platform.service';

@Component({
  selector: 'app-break-glass-drawer',
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
  templateUrl: './break-glass-drawer.component.html'
})
export class BreakGlassDrawerComponent {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  user = input<PlatformUser | null>(null);

  close = output<void>();
  completed = output<string>();

  readonly breakGlassAction = BreakGlassAction;
  readonly mode = signal<BreakGlassAction>(BreakGlassAction.FORCE_PASSWORD_RESET);
  readonly supportTicket = signal<string>('');
  readonly reason = signal<string>('');
  readonly password = signal<string>('');
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.mode.set(BreakGlassAction.FORCE_PASSWORD_RESET);
        this.supportTicket.set('');
        this.reason.set('');
        this.password.set('');
        this.errorText.set('');
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  selectMode(mode: BreakGlassAction) {
    this.mode.set(mode);
    this.errorText.set('');
  }

  submit() {
    const current = this.user();
    if (!current) {
      return;
    }
    if (this.mode() === BreakGlassAction.FORCE_PASSWORD_RESET) {
      this.saving.set(true);
      this.platform.forcePasswordReset(current.user_id).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.completed.emit(res.code);
        },
        error: (err) => {
          this.saving.set(false);
          this.showError(err);
        }
      });
      return;
    }

    if (!this.supportTicket().trim() || !this.reason().trim() || !this.password()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    this.saving.set(true);
    this.platform
      .breakGlassDisable2Fa(current.user_id, {
        support_ticket: this.supportTicket().trim(),
        reason: this.reason().trim(),
        confirm_password: this.password()
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.completed.emit(res.code);
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
