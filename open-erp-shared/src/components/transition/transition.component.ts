import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransitionType } from '../../enums/component.enum';

@Component({
  selector: 'erp-transition, erp-motion',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (show) {
      <div [class]="transitionClasses"
           [style.animation-duration.ms]="duration"
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
  @Input() show: boolean = true;
  @Input() type: TransitionType | 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'collapse' = TransitionType.FADE;
  @Input() duration: number = 250;

  get transitionClasses(): string {
    switch (this.type) {
      case 'scale':
        return 'animate-in zoom-in-95 fade-in';
      case 'slide-up':
        return 'animate-in slide-in-from-bottom-4 fade-in';
      case 'slide-down':
        return 'animate-in slide-in-from-top-4 fade-in';
      case 'slide-left':
        return 'animate-in slide-in-from-right-4 fade-in';
      case 'slide-right':
        return 'animate-in slide-in-from-left-4 fade-in';
      case 'collapse':
        return 'overflow-hidden transition-all duration-300';
      case 'fade':
      default:
        return 'animate-in fade-in';
    }
  }
}
