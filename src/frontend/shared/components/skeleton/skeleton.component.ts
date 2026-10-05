import { Component, computed, input } from '@angular/core';

export type SkeletonVariant = 'line' | 'block' | 'circle';

const DEFAULT_HEIGHT: Record<SkeletonVariant, string> = {
  line: '0.75rem',
  block: '4rem',
  circle: '1.5rem'
};

/**
 * Decorative shimmer placeholder. Always `aria-hidden`; callers expose loading
 * state on the surrounding region via `aria-busy`.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styles: [`
    .skeleton {
      position: relative;
      overflow: hidden;
    }

    .skeleton::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
      animation: op-skeleton-shimmer 1.4s ease-in-out infinite;
    }

    @keyframes op-skeleton-shimmer {
      100% { transform: translateX(100%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton::after {
        animation: none;
      }
    }
  `]
})
export class SkeletonComponent {
  variant = input<SkeletonVariant>('line');
  /** CSS width. Defaults to `100%`, or to the resolved height for circles. */
  width = input<string>('');
  /** CSS height. Defaults per variant. */
  height = input<string>('');

  readonly isCircle = computed(() => this.variant() === 'circle');
  readonly resolvedHeight = computed(() => this.height() || DEFAULT_HEIGHT[this.variant()]);
  readonly resolvedWidth = computed(
    () => this.width() || (this.isCircle() ? this.resolvedHeight() : '100%')
  );
}
