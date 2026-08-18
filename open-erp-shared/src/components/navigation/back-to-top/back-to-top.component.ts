import { Component, Input, Output, EventEmitter, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { BackToTopShape } from '../../../enums/component.enum';

@Component({
  selector: 'erp-back-to-top',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './back-to-top.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BackToTopComponent implements OnInit {
  @Input() threshold: number = 300;
  @Input() shape: BackToTopShape | 'circle' | 'rounded' | 'pill' = BackToTopShape.CIRCLE;
  @Input() showProgress: boolean = true;
  @Input() icon: IconName = 'arrow-up';
  @Input() text?: string;
  @Input() tooltip: string = 'Lên đầu trang';
  @Input() targetSelector?: string;
  @Input() right: string = '2rem';
  @Input() bottom: string = '2rem';

  @Output() scrollClick = new EventEmitter<void>();

  visible: boolean = false;
  scrollProgress: number = 0; // 0 to 100

  get isCircle(): boolean {
    return String(this.shape) === 'circle';
  }

  get isRounded(): boolean {
    return String(this.shape) === 'rounded';
  }

  get isPill(): boolean {
    return String(this.shape) === 'pill';
  }

  ngOnInit(): void {
    this.updateScrollState();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.updateScrollState();
  }

  scrollToTop(): void {
    this.scrollClick.emit();

    if (this.targetSelector && typeof document !== 'undefined') {
      const container = document.querySelector(this.targetSelector);
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private updateScrollState(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let scrollTop = window.scrollY;
    let docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (this.targetSelector) {
      const container = document.querySelector(this.targetSelector) as HTMLElement;
      if (container) {
        scrollTop = container.scrollTop;
        docHeight = container.scrollHeight - container.clientHeight;
      }
    }

    this.visible = scrollTop > this.threshold;
    this.scrollProgress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
  }
}
