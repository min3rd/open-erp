import { Component, ChangeDetectionStrategy, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'erp-watermark',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full overflow-hidden" [style.min-height]="'100%'">
      <!-- Main Nested Content -->
      <div class="relative z-0">
        <ng-content></ng-content>
      </div>

      <!-- Watermark Canvas Overlay -->
      <div class="pointer-events-none absolute inset-0 z-10 select-none"
           [style.background-image]="watermarkPattern()"
           [style.background-repeat]="'repeat'"
           [style.background-size]="patternSize()"
           [style.opacity]="opacity()">
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
export class WatermarkComponent {
  readonly content = input<string | string[]>('OPEN ERP 2026');
  readonly image = input<string | undefined>(undefined);
  readonly width = input<number>(240);
  readonly height = input<number>(120);
  readonly rotate = input<number>(-22);
  readonly opacity = input<number>(0.12);
  readonly fontSize = input<number>(14);
  readonly fontColor = input<string>('currentColor');

  watermarkPattern = signal<string>('');
  patternSize = signal<string>('240px 120px');

  constructor() {
    effect(() => {
      // track inputs
      this.content();
      this.image();
      this.width();
      this.height();
      this.rotate();
      this.fontSize();
      this.generateWatermark();
    });
  }

  private generateWatermark(): void {
    if (typeof document === 'undefined') return;

    const w = this.width();
    const h = this.height();
    const r = this.rotate();
    const fs = this.fontSize();
    const imgUrl = this.image();
    const cont = this.content();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = w;
    canvas.height = h;
    this.patternSize.set(`${w}px ${h}px`);

    ctx.translate(w / 2, h / 2);
    ctx.rotate((r * Math.PI) / 180);

    if (imgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgUrl;
      img.onload = () => {
        ctx.drawImage(img, -w / 4, -h / 4, w / 2, h / 2);
        this.watermarkPattern.set(`url(${canvas.toDataURL()})`);
      };
    } else {
      ctx.font = `600 ${fs}px sans-serif`;
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lines = Array.isArray(cont) ? cont : [cont];
      const lineHeight = fs * 1.4;
      const startY = -((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, 0, startY + index * lineHeight);
      });

      this.watermarkPattern.set(`url(${canvas.toDataURL()})`);
    }
  }
}
