import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransitionType } from '../../enums/component.enum';

const TRANSITION_CLASSES: Record<string, string> = {
  scale: 'animate-in zoom-in-95 fade-in',
  'slide-up': 'animate-in slide-in-from-bottom-4 fade-in',
  'slide-down': 'animate-in slide-in-from-top-4 fade-in',
  'slide-left': 'animate-in slide-in-from-right-4 fade-in',
  'slide-right': 'animate-in slide-in-from-left-4 fade-in',
  collapse: 'overflow-hidden transition-all duration-300',
  fade: 'animate-in fade-in'
};

@Component({
  selector: 'erp-transition, erp-motion',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div [class]="transitionClasses()"
           [style.animation-duration.ms]="duration()"
           class="transition-all duration-300">
        <ng-content></ng-content>
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class TransitionComponent {
  readonly show = input<boolean>(true);
  readonly type = input<TransitionType | 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'collapse'>(TransitionType.FADE);
  readonly duration = input<number>(250);

  readonly transitionClasses = computed(() => {
    const t = String(this.type());
    return TRANSITION_CLASSES[t] || TRANSITION_CLASSES['fade'];
  });
}
