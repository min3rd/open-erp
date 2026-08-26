import { Component, ChangeDetectionStrategy, input, model, output, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface CarouselSlide {
  id?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  tag?: string;
  buttonText?: string;
}

@Component({
  selector: 'erp-carousel, erp-slider-view',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './carousel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CarouselComponent implements OnInit, OnDestroy {
  readonly slides = input<(string | CarouselSlide)[]>([]);
  readonly currentIndex = model<number>(0);
  readonly autoplay = input<boolean>(true);
  readonly interval = input<number>(4000);
  readonly showArrows = input<boolean>(true);
  readonly showDots = input<boolean>(true);
  readonly height = input<string>('240px');

  readonly indexChange = output<number>();
  readonly slideClick = output<{ slide: CarouselSlide; index: number }>();

  private timerRef?: any;

  readonly normalizedSlides = computed<CarouselSlide[]>(() => {
    return this.slides().map(s => (typeof s === 'string' ? { imageUrl: s } : s));
  });

  constructor() {
    effect(() => {
      const isAuto = this.autoplay();
      if (isAuto) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    });
  }

  ngOnInit(): void {
    if (this.autoplay()) {
      this.startAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  startAutoplay(): void {
    if (this.autoplay() && typeof window !== 'undefined') {
      this.stopAutoplay();
      this.timerRef = setInterval(() => {
        this.next();
      }, this.interval());
    }
  }

  stopAutoplay(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = undefined;
    }
  }

  next(): void {
    const total = this.normalizedSlides().length;
    if (total === 0) return;
    const nextIdx = (this.currentIndex() + 1) % total;
    this.currentIndex.set(nextIdx);
    this.indexChange.emit(nextIdx);
  }

  prev(): void {
    const total = this.normalizedSlides().length;
    if (total === 0) return;
    const prevIdx = (this.currentIndex() - 1 + total) % total;
    this.currentIndex.set(prevIdx);
    this.indexChange.emit(prevIdx);
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
    this.indexChange.emit(index);
  }

  onSlideClick(slide: CarouselSlide, index: number): void {
    this.slideClick.emit({ slide, index });
  }
}
