import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'erp-image',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './image.component.html',
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class ImageComponent {
  @Input() src: string = '';
  @Input() alt: string = 'Image';
  @Input() width?: string;
  @Input() height?: string;
  @Input() preview: boolean = true;
  @Input() fallbackSrc: string = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80';
  @Input() rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'lg';

  isLoaded: boolean = false;
  hasError: boolean = false;
  isPreviewOpen: boolean = false;
  zoomScale: number = 1;
  rotateDeg: number = 0;

  onLoad(): void {
    this.isLoaded = true;
  }

  onError(): void {
    this.hasError = true;
  }

  openPreview(event: MouseEvent): void {
    if (!this.preview) return;
    event.stopPropagation();
    this.isPreviewOpen = true;
    this.zoomScale = 1;
    this.rotateDeg = 0;
  }

  closePreview(): void {
    this.isPreviewOpen = false;
  }

  zoomIn(): void {
    this.zoomScale = Math.min(3, this.zoomScale + 0.25);
  }

  zoomOut(): void {
    this.zoomScale = Math.max(0.5, this.zoomScale - 0.25);
  }

  rotate(): void {
    this.rotateDeg = (this.rotateDeg + 90) % 360;
  }

  getRoundedClass(): string {
    switch (this.rounded) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-md';
      case 'md': return 'rounded-xl';
      case 'xl': return 'rounded-3xl';
      case 'full': return 'rounded-full';
      case 'lg':
      default: return 'rounded-2xl';
    }
  }
}
