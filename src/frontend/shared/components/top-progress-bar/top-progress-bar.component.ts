import { Component, inject } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

/**
 * Thin indeterminate bar pinned to the very top of the viewport. Purely
 * decorative: regions expose their own `aria-busy` state, so this is hidden
 * from assistive tech.
 */
@Component({
  selector: 'app-top-progress-bar',
  standalone: true,
  templateUrl: './top-progress-bar.component.html',
  styles: [`
    .top-progress-track {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      z-index: 9999;
      overflow: hidden;
    }

    .top-progress-indeterminate {
      height: 100%;
      width: 40%;
      animation: op-top-progress 1.2s ease-in-out infinite;
    }

    @keyframes op-top-progress {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .top-progress-indeterminate {
        animation: none;
        width: 100%;
      }
    }

    /* RTL: sweep from the inline-start (right) instead of left. */
    :host-context([dir='rtl']) .top-progress-indeterminate {
      animation-direction: reverse;
    }
  `]
})
export class TopProgressBarComponent {
  private loadingService = inject(LoadingService);
  readonly loading = this.loadingService.loading;
}
