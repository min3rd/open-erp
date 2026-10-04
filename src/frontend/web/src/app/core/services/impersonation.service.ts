import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { PlatformService } from './platform.service';
import { ImpersonationSessionData, decodeJwtPayload, readNumberClaim } from '@shared';

export const IMPERSONATION_TOKEN_KEY = 'openerp_impersonation_token';
export const IMPERSONATION_SESSION_KEY = 'openerp_impersonation_session';

export interface ImpersonationUiSession {
  session: ImpersonationSessionData;
  admin_email: string;
  support_ticket: string;
  expires_at: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImpersonationService {
  private router = inject(Router);
  private auth = inject(AuthService);
  private platform = inject(PlatformService);

  private sessionSignal = signal<ImpersonationUiSession | null>(this.loadStoredSession());

  readonly session = computed(() => this.sessionSignal());
  readonly isActive = computed(() => this.sessionSignal() !== null);

  constructor() {
    window.addEventListener('openerp:impersonation-ended', () => {
      this.sessionSignal.set(null);
    });
  }

  getToken(): string | null {
    return localStorage.getItem(IMPERSONATION_TOKEN_KEY);
  }

  startSession(data: ImpersonationSessionData, supportTicket: string) {
    const expiresAt = this.resolveExpiresAt(data);
    const uiSession: ImpersonationUiSession = {
      session: data,
      admin_email: this.auth.user()?.email || '',
      support_ticket: supportTicket,
      expires_at: expiresAt
    };
    localStorage.setItem(IMPERSONATION_TOKEN_KEY, data.impersonation_token);
    localStorage.setItem(IMPERSONATION_SESSION_KEY, JSON.stringify(uiSession));
    this.sessionSignal.set(uiSession);
  }

  exitSession() {
    this.platform.exitImpersonation().subscribe({
      next: () => this.finishExit(),
      error: () => this.finishExit()
    });
  }

  clearLocalSession() {
    localStorage.removeItem(IMPERSONATION_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATION_SESSION_KEY);
    this.sessionSignal.set(null);
  }

  private finishExit() {
    this.clearLocalSession();
    this.router.navigate(['/platform/tenants']);
  }

  private resolveExpiresAt(data: ImpersonationSessionData): number {
    const exp = readNumberClaim(decodeJwtPayload(data.impersonation_token), 'exp');
    if (exp !== null) {
      return exp * 1000;
    }
    const startedAt = Date.parse(data.started_at);
    const base = Number.isNaN(startedAt) ? Date.now() : startedAt;
    return base + data.expires_in_seconds * 1000;
  }

  private loadStoredSession(): ImpersonationUiSession | null {
    const raw = localStorage.getItem(IMPERSONATION_SESSION_KEY);
    if (!raw || !localStorage.getItem(IMPERSONATION_TOKEN_KEY)) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as ImpersonationUiSession;
      if (parsed.expires_at <= Date.now()) {
        localStorage.removeItem(IMPERSONATION_TOKEN_KEY);
        localStorage.removeItem(IMPERSONATION_SESSION_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
