import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@shared';
import { SharpButtonComponent } from '@shared';
import { ButtonVariant } from '@shared';
import { ImpersonationService } from '../../../core/services/impersonation.service';

@Component({
  selector: 'app-impersonation-banner',
  standalone: true,
  imports: [CommonModule, TranslatePipe, SharpButtonComponent],
  templateUrl: './impersonation-banner.component.html'
})
export class ImpersonationBannerComponent {
  private impersonation = inject(ImpersonationService);
  private nowSignal = signal<number>(Date.now());

  readonly buttonVariantPrimary = ButtonVariant.PRIMARY;
  readonly session = this.impersonation.session;
  readonly isActive = this.impersonation.isActive;

  readonly countdown = computed(() => {
    const active = this.session();
    if (!active) {
      return '00:00';
    }
    const remaining = Math.max(0, Math.floor((active.expires_at - this.nowSignal()) / 1000));
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  constructor() {
    const timer = setInterval(() => this.nowSignal.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  exitSession() {
    this.impersonation.exitSession();
  }
}
