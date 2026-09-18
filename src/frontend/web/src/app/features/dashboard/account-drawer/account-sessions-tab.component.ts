import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { 
  I18nService, 
  TranslateDirective, 
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  ButtonVariant,
  ButtonSize,
  BadgeVariant,
  UserSessionData,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-account-sessions-tab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent
  ],
  templateUrl: './account-sessions-tab.component.html'
})
export class AccountSessionsTabComponent implements OnInit {
  accountService = inject(AccountService);
  i18n = inject(I18nService);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
  readonly buttonVariantDanger = ButtonVariant.DANGER;
  readonly buttonSizeSm = ButtonSize.SM;
  readonly badgeVariantInfo = BadgeVariant.INFO;

  sessions = signal<UserSessionData[]>([]);
  sessionsSuccess = signal<string | null>(null);
  sessionsError = signal<string | null>(null);

  sessionToRevoke = signal<string | null>(null);
  confirmRevokeOthers = signal<boolean>(false);
  loadingRevoke = signal<boolean>(false);

  ngOnInit() {
    this.loadSessions();
  }

  loadSessions() {
    this.accountService.getSessions().subscribe({
      next: (res) => {
        this.sessions.set(res.data?.items ?? []);
      },
      error: (err) => {
        this.sessionsError.set(apiMessage(this.i18n, err));
      }
    });
  }

  requestRevokeSession(sessionId: string) {
    this.sessionsError.set(null);
    this.sessionsSuccess.set(null);
    this.sessionToRevoke.set(sessionId);
  }

  cancelRevokeSession() {
    this.sessionToRevoke.set(null);
  }

  confirmRevokeSession() {
    const sessionId = this.sessionToRevoke();
    if (!sessionId) return;

    this.loadingRevoke.set(true);
    this.accountService.revokeSession(sessionId).subscribe({
      next: () => {
        this.loadingRevoke.set(false);
        this.sessionToRevoke.set(null);
        this.sessionsSuccess.set(this.i18n.t('ACCOUNT_SESSION_REVOKED_SUCCESS'));
        this.loadSessions();
      },
      error: (err) => {
        this.loadingRevoke.set(false);
        this.sessionsError.set(apiMessage(this.i18n, err));
      }
    });
  }

  requestRevokeOtherSessions() {
    this.sessionsError.set(null);
    this.sessionsSuccess.set(null);
    this.confirmRevokeOthers.set(true);
  }

  cancelRevokeOtherSessions() {
    this.confirmRevokeOthers.set(false);
  }

  confirmRevokeOtherSessions() {
    this.loadingRevoke.set(true);
    this.accountService.revokeOtherSessions().subscribe({
      next: () => {
        this.loadingRevoke.set(false);
        this.confirmRevokeOthers.set(false);
        this.sessionsSuccess.set(this.i18n.t('ACCOUNT_OTHER_SESSIONS_REVOKED_SUCCESS'));
        this.loadSessions();
      },
      error: (err) => {
        this.loadingRevoke.set(false);
        this.sessionsError.set(apiMessage(this.i18n, err));
      }
    });
  }
}
