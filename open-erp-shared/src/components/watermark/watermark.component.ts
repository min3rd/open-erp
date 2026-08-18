import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'erp-watermark',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full overflow-hidden" [style.min-height]="'100%'">
      <!-- Main Nested Content -->
      <div class="relative z-0">
        <ng-content></ng-content>
      </div>

      <!-- Watermark Canvas Overlay -->
      <div class="pointer-events-none absolute inset-0 z-10 select-none"
           [style.background-image]="watermarkPattern"
           [style.background-repeat]="'repeat'"
           [style.background-size]="patternSize"
           [style.opacity]="opacity">
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
    }
  `]
})
export class WatermarkComponent implements OnInit, OnChanges {
  @Input() content: string | string[] = 'OPEN ERP 2026';
  @Input() image?: string;
  @Input() width: number = 240;
  @Input() height: number = 120;
  @Input() rotate: number = -22;
  @Input() opacity: number = 0.12;
  @Input() fontSize: number = 14;
  @Input() fontColor: string = 'currentColor';

  watermarkPattern: string = '';
  patternSize: string = '240px 120px';

  ngOnInit(): void {
    this.generateWatermark();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.generateWatermark();
  }

  private generateWatermark(): void {
    if (typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = this.width;
    canvas.height = this.height;
    this.patternSize = `${this.width}px ${this.height}px`;

    ctx.translate(this.width / 2, this.height / 2);
    ctx.rotate((this.rotate * Math.PI) / 180);

    if (this.image) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = this.image;
      img.onload = () => {
        ctx.drawImage(img, -this.width / 4, -this.height / 4, this.width / 2, this.height / 2);
        this.watermarkPattern = `url(${canvas.toDataURL()})`;
      };
    } else {
      ctx.font = `600 ${this.fontSize}px sans-serif`;
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lines = Array.isArray(this.content) ? this.content : [this.content];
      const lineHeight = this.fontSize * 1.4;
      const startY = -((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, 0, startY + index * lineHeight);
      });

      this.watermarkPattern = `url(${canvas.toDataURL()})`;
    }
  }
}
