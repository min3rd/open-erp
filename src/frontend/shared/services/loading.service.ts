import { Injectable, signal } from '@angular/core';

/**
 * Counts in-flight HTTP requests and exposes a debounced `loading` flag.
 *
 * The flag turns on only after {@link SHOW_DELAY_MS} so fast responses never
 * flash the top progress bar, and turns off immediately when the last request
 * finishes (including errors/cancellations, handled by the interceptor's
 * `finalize`).
 */
export const SHOW_DELAY_MS = 150;

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  begin(): void {
    this.count += 1;
    if (this.count === 1 && !this.loadingSignal()) {
      this.showTimer = setTimeout(() => {
        this.showTimer = null;
        this.loadingSignal.set(true);
      }, SHOW_DELAY_MS);
    }
  }

  end(): void {
    if (this.count === 0) {
      return;
    }
    this.count -= 1;
    if (this.count === 0) {
      this.clearTimer();
      this.loadingSignal.set(false);
    }
  }

  private clearTimer(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }
}
