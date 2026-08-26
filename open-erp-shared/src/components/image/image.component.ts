import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

const ROUNDED_CLASSES: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-md',
  md: 'rounded-xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
  lg: 'rounded-2xl'
};

@Component({
  selector: 'erp-image',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class ImageComponent {
  readonly src = input<string>('');
  readonly alt = input<string>('Image');
  readonly width = input<string | undefined>(undefined);
  readonly height = input<string | undefined>(undefined);
  readonly preview = input<boolean>(true);
  readonly fallbackSrc = input<string>('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80');
  readonly rounded = input<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>('lg');

  isLoaded = signal<boolean>(false);
  hasError = signal<boolean>(false);
  isPreviewOpen = signal<boolean>(false);
  zoomScale = signal<number>(1);
  rotateDeg = signal<number>(0);

  readonly roundedClass = computed(() => {
    return ROUNDED_CLASSES[this.rounded()] || ROUNDED_CLASSES['lg'];
  });

  onLoad(): void {
    this.isLoaded.set(true);
  }

  onError(): void {
    this.hasError.set(true);
  }

  openPreview(event: MouseEvent): void {
    if (!this.preview()) return;
    event.stopPropagation();
    this.isPreviewOpen.set(true);
    this.zoomScale.set(1);
    this.rotateDeg.set(0);
  }

  closePreview(): void {
    this.isPreviewOpen.set(false);
  }

  zoomIn(): void {
    this.zoomScale.set(Math.min(3, this.zoomScale() + 0.25));
  }

  zoomOut(): void {
    this.zoomScale.set(Math.max(0.5, this.zoomScale() - 0.25));
  }

  rotate(): void {
    this.rotateDeg.set((this.rotateDeg() + 90) % 360);
  }
}
