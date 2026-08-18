import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
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
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CarouselComponent implements OnInit, OnDestroy, OnChanges {
  @Input() slides: (string | CarouselSlide)[] = [];
  @Input() currentIndex: number = 0;
  @Input() autoplay: boolean = true;
  @Input() interval: number = 4000;
  @Input() showArrows: boolean = true;
  @Input() showDots: boolean = true;
  @Input() height: string = '240px';

  @Output() indexChange = new EventEmitter<number>();
  @Output() slideClick = new EventEmitter<{ slide: CarouselSlide; index: number }>();

  private timerRef?: any;

  get normalizedSlides(): CarouselSlide[] {
    return this.slides.map(s => typeof s === 'string' ? { imageUrl: s } : s);
  }

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['autoplay'] && !changes['autoplay'].firstChange) {
      if (this.autoplay) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    }
  }
  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  startAutoplay(): void {
    if (this.autoplay && typeof window !== 'undefined') {
      this.stopAutoplay();
      this.timerRef = setInterval(() => {
        this.next();
      }, this.interval);
    }
  }

  stopAutoplay(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = undefined;
    }
  }

  next(): void {
    const total = this.normalizedSlides.length;
    if (total === 0) return;
    this.currentIndex = (this.currentIndex + 1) % total;
    this.indexChange.emit(this.currentIndex);
  }

  prev(): void {
    const total = this.normalizedSlides.length;
    if (total === 0) return;
    this.currentIndex = (this.currentIndex - 1 + total) % total;
    this.indexChange.emit(this.currentIndex);
  }

  goTo(index: number): void {
    this.currentIndex = index;
    this.indexChange.emit(this.currentIndex);
  }

  onSlideClick(slide: CarouselSlide, index: number): void {
    this.slideClick.emit({ slide, index });
  }
}
