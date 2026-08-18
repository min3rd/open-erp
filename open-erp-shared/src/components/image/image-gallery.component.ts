import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageComponent } from './image.component';

export interface GalleryImage {
  src: string;
  alt?: string;
  title?: string;
}

@Component({
  selector: 'erp-image-gallery',
  standalone: true,
  imports: [CommonModule, ImageComponent],
  templateUrl: './image-gallery.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class ImageGalleryComponent {
  @Input() images: (string | GalleryImage)[] = [];
  @Input() columns: number = 4;
  @Input() height: string = '120px';

  get normalizedImages(): GalleryImage[] {
    return this.images.map(img => typeof img === 'string' ? { src: img } : img);
  }

  getGridColsClasses(): string {
    switch (this.columns) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-2 sm:grid-cols-3';
      case 6: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6';
      case 4:
      default: return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
    }
  }
}
