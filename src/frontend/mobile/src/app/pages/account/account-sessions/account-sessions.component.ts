import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../core/account.service';
import {
  I18nService,
  TranslateDirective,
  TranslatePipe,
  SharpButtonComponent,
  BadgeComponent,
  ButtonVariant,
  ButtonSize,
  BadgeVariant,
  apiMessage,
  UserSessionData
} from '@shared';

@Component({
  selector: 'app-account-sessions',
  standalone: true,
  imports: [
    CommonModule,
    TranslateDirective,
    TranslatePipe,
    SharpButtonComponent,
    BadgeComponent
  ],
  templateUrl: './account-sessions.component.html'
})
export class AccountSessionsComponent implements OnInit {
  private accountService = inject(AccountService);
  private i18n = inject(I18nService);

  readonly buttonVariantSecondary = ButtonVariant.SECONDARY;
  readonly buttonVariantDanger = ButtonVariant.DANGER;
  readonly buttonSizeSm = ButtonSize.SM;
  readonly badgeVariantSuccess = BadgeVariant.SUCCESS;

  sessions = signal<UserSessionData[]>([]);
  sessionsError = signal<string | null>(null);
  sessionsSuccess = signal<string | null>(null);
  busySessionId = signal<string | null>(null);

  ngOnInit() {
    this.loadSessions();
  }

  loadSessions() {
    this.accountService.getSessions().subscribe({
      next: (res) => {
        this.sessions.set(res.data?.items || []);
      },
      error: (err) => {
        this.sessionsError.set(apiMessage(this.i18n, err));
      }
    });
  }

  handleRevokeSession(sessionId: string) {
    this.sessionsError.set(null);
    this.sessionsSuccess.set(null);
    this.busySessionId.set(sessionId);

    this.accountService.revokeSession(sessionId).subscribe({
      next: () => {
        this.busySessionId.set(null);
        this.sessionsSuccess.set(this.i18n.t('ACCOUNT_SESSION_REVOKED_SUCCESS'));
        this.loadSessions();
      },
      error: (err) => {
        this.busySessionId.set(null);
        this.sessionsError.set(apiMessage(this.i18n, err));
      }
    });
  }

  handleRevokeOtherSessions() {
    this.sessionsError.set(null);
    this.sessionsSuccess.set(null);
    this.busySessionId.set('__others__');

    this.accountService.revokeOtherSessions().subscribe({
      next: () => {
        this.busySessionId.set(null);
        this.sessionsSuccess.set(this.i18n.t('ACCOUNT_OTHER_SESSIONS_REVOKED_SUCCESS'));
        this.loadSessions();
      },
      error: (err) => {
        this.busySessionId.set(null);
        this.sessionsError.set(apiMessage(this.i18n, err));
      }
    });
  }
}
