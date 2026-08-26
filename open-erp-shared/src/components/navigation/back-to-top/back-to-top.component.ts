import { Component, ChangeDetectionStrategy, input, output, signal, computed, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { BackToTopShape } from '../../../enums/component.enum';

@Component({
  selector: 'erp-back-to-top',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './back-to-top.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BackToTopComponent implements OnInit {
  readonly threshold = input<number>(300);
  readonly shape = input<BackToTopShape | 'circle' | 'rounded' | 'pill'>(BackToTopShape.CIRCLE);
  readonly showProgress = input<boolean>(true);
  readonly icon = input<IconName>('arrow-up');
  readonly text = input<string | undefined>(undefined);
  readonly tooltip = input<string>('Lên đầu trang');
  readonly targetSelector = input<string | undefined>(undefined);
  readonly right = input<string>('2rem');
  readonly bottom = input<string>('2rem');

  readonly scrollClick = output<void>();

  visible = signal<boolean>(false);
  scrollProgress = signal<number>(0);

  readonly isCircle = computed(() => String(this.shape()) === 'circle');
  readonly isRounded = computed(() => String(this.shape()) === 'rounded');
  readonly isPill = computed(() => String(this.shape()) === 'pill');

  ngOnInit(): void {
    this.updateScrollState();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.updateScrollState();
  }

  scrollToTop(): void {
    this.scrollClick.emit();
    const sel = this.targetSelector();

    if (sel && typeof document !== 'undefined') {
      const container = document.querySelector(sel);
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
    const sel = this.targetSelector();

    if (sel) {
      const container = document.querySelector(sel) as HTMLElement;
      if (container) {
        scrollTop = container.scrollTop;
        docHeight = container.scrollHeight - container.clientHeight;
      }
    }

    this.visible.set(scrollTop > this.threshold());
    this.scrollProgress.set(docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0);
  }
}
