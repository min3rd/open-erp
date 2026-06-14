import { Component, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { TranslocoModule } from '@jsverse/transloco';

export interface TourStep {
  title: string;
  description: string;
  selector?: string;
}

@Component({
  selector: 'oerp-guide-tour',
  standalone: true,
  imports: [CommonModule, IconComponent, TranslocoModule],
  templateUrl: './guide-tour.component.html',
  styleUrls: ['./guide-tour.component.scss']
})
export class GuideTourComponent {
  pageKey = input.required<string>();
  steps = input.required<TourStep[]>();
  onClose = output<void>();

  currentStepIndex = signal<number>(0);

  // Spotlight coordinates
  hasHighlight = signal<boolean>(false);
  highlightLeft = signal<number>(0);
  highlightTop = signal<number>(0);
  highlightWidth = signal<number>(0);
  highlightHeight = signal<number>(0);

  // Tooltip coordinates
  tooltipTop = signal<number>(0);
  tooltipLeft = signal<number>(0);
  isCentered = signal<boolean>(true);
  isPositionedBelow = signal<boolean>(true);

  currentStep = computed(() => this.steps()[this.currentStepIndex()]);

  constructor() {
    effect(() => {
      // Trigger updates when step index changes
      this.currentStepIndex();
      this.updateSpotlight();
    });
  }

  ngOnInit() {
    // Add small delay to ensure initial DOM rendering is complete
    setTimeout(() => {
      this.updateSpotlight();
    }, 300);

    // Watch window resize to recalculate spotlight
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.updateSpotlight();
  };

  updateSpotlight() {
    const stepsList = this.steps();
    const index = this.currentStepIndex();
    if (index < 0 || index >= stepsList.length) return;

    const step = stepsList[index];
    if (step && step.selector) {
      const el = document.querySelector(step.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        this.highlightLeft.set(rect.left - 4);
        this.highlightTop.set(rect.top - 4);
        this.highlightWidth.set(rect.width + 8);
        this.highlightHeight.set(rect.height + 8);
        this.hasHighlight.set(true);

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const tooltipWidth = Math.min(320, viewportWidth - 32);

        // Position tooltip below element if space permits, otherwise above it
        if (rect.bottom + 180 < viewportHeight) {
          this.tooltipTop.set(rect.bottom + 12);
          this.isPositionedBelow.set(true);
        } else {
          this.tooltipTop.set(Math.max(16, rect.top - 160));
          this.isPositionedBelow.set(false);
        }

        // Center tooltip relative to element
        const elementCenter = rect.left + rect.width / 2;
        let leftPos = elementCenter - tooltipWidth / 2;
        leftPos = Math.max(16, Math.min(viewportWidth - tooltipWidth - 16, leftPos));
        this.tooltipLeft.set(leftPos);
        
        this.isCentered.set(false);
        return;
      }
    }
    
    // Default fallback: centered in the viewport
    this.hasHighlight.set(false);
    this.isCentered.set(true);
  }

  nextStep() {
    const nextIndex = this.currentStepIndex() + 1;
    if (nextIndex < this.steps().length) {
      this.currentStepIndex.set(nextIndex);
    } else {
      this.finishTour();
    }
  }

  prevStep() {
    const prevIndex = this.currentStepIndex() - 1;
    if (prevIndex >= 0) {
      this.currentStepIndex.set(prevIndex);
    }
  }

  skipTour() {
    this.finishTour();
  }

  private finishTour() {
    localStorage.setItem(`guide_seen_${this.pageKey()}`, 'true');
    this.onClose.emit();
  }
}
