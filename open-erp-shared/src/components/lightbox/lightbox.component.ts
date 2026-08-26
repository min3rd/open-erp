import { Component, ChangeDetectionStrategy, input, model, output, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'erp-lightbox, erp-image-preview',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible() && images().length > 0) {
      <div class="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none transition-all duration-300 animate-in fade-in"
           role="dialog"
           aria-modal="true">
        
        <!-- Lightbox Top Controls Bar -->
        <div class="flex items-center justify-between text-white z-10">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-xl bg-white/10 text-xs font-mono font-bold tracking-wider">
              {{ currentIndex() + 1 }} / {{ images().length }}
            </span>
            @if (title()) {
              <span class="text-sm font-semibold truncate">{{ title() }}</span>
            }
          </div>

          <div class="flex items-center gap-2">
            <!-- Zoom In -->
            <button (click)="zoomIn()"
                    class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Phóng to"
                    aria-label="Phóng to">
              <erp-icon name="plus" [size]="16"></erp-icon>
            </button>

            <!-- Zoom Out -->
            <button (click)="zoomOut()"
                    class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Thu nhỏ"
                    aria-label="Thu nhỏ">
              <erp-icon name="minus" [size]="16"></erp-icon>
            </button>

            <!-- Rotate -->
            <button (click)="rotateClockwise()"
                    class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Xoay ảnh"
                    aria-label="Xoay ảnh">
              <erp-icon name="refresh-cw" [size]="16"></erp-icon>
            </button>

            <!-- Close Button -->
            <button (click)="handleClose()"
                    class="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer ml-2"
                    title="Đóng (Esc)"
                    aria-label="Đóng">
              <erp-icon name="x" [size]="18"></erp-icon>
            </button>
          </div>
        </div>

        <!-- Main Image Viewport Area -->
        <div class="relative flex-1 flex items-center justify-center overflow-hidden my-4">
          
          <!-- Prev Button -->
          @if (images().length > 1) {
            <button (click)="prevImage()"
                    class="absolute left-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all transform hover:scale-110 cursor-pointer z-10"
                    title="Ảnh trước (Mũi tên trái)"
                    aria-label="Ảnh trước">
              <erp-icon name="chevron-left" [size]="24"></erp-icon>
            </button>
          }

          <!-- Zoomable / Rotatable Image -->
          <img [src]="images()[currentIndex()]"
               [alt]="'Preview ' + (currentIndex() + 1)"
               [style.transform]="'scale(' + zoomLevel() + ') rotate(' + rotation() + 'deg)'"
               class="max-w-[85vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl transition-transform duration-300 pointer-events-auto cursor-grab active:cursor-grabbing" />

          <!-- Next Button -->
          @if (images().length > 1) {
            <button (click)="nextImage()"
                    class="absolute right-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all transform hover:scale-110 cursor-pointer z-10"
                    title="Ảnh sau (Mũi tên phải)"
                    aria-label="Ảnh sau">
              <erp-icon name="chevron-right" [size]="24"></erp-icon>
            </button>
          }
        </div>

        <!-- Bottom Thumbnail Strip -->
        @if (images().length > 1) {
          <div class="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10 custom-scrollbar">
            @for (img of images(); track $index) {
              <button (click)="selectIndex($index)"
                      [class.ring-2]="currentIndex() === $index"
                      [class.ring-indigo-500]="currentIndex() === $index"
                      [class.opacity-100]="currentIndex() === $index"
                      [class.opacity-50]="currentIndex() !== $index"
                      class="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/20 hover:opacity-100 transition-all cursor-pointer">
                <img [src]="img" alt="Thumbnail" class="w-full h-full object-cover" />
              </button>
            }
          </div>
        }

      </div>
    }
  `
})
export class LightboxComponent {
  readonly images = input<string[]>([]);
  readonly currentIndex = model<number>(0);
  readonly visible = model<boolean>(false);
  readonly title = input<string | undefined>(undefined);

  readonly indexChange = output<number>();

  zoomLevel = signal<number>(1);
  rotation = signal<number>(0);

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.visible()) return;
    if (event.key === 'Escape') this.handleClose();
    if (event.key === 'ArrowLeft') this.prevImage();
    if (event.key === 'ArrowRight') this.nextImage();
  }

  handleClose(): void {
    this.visible.set(false);
    this.resetTransform();
  }

  selectIndex(idx: number): void {
    this.currentIndex.set(idx);
    this.indexChange.emit(idx);
    this.resetTransform();
  }

  prevImage(): void {
    const total = this.images().length;
    if (total === 0) return;
    const prev = (this.currentIndex() - 1 + total) % total;
    this.currentIndex.set(prev);
    this.indexChange.emit(prev);
    this.resetTransform();
  }

  nextImage(): void {
    const total = this.images().length;
    if (total === 0) return;
    const next = (this.currentIndex() + 1) % total;
    this.currentIndex.set(next);
    this.indexChange.emit(next);
    this.resetTransform();
  }

  zoomIn(): void {
    if (this.zoomLevel() < 3) this.zoomLevel.update(z => z + 0.25);
  }

  zoomOut(): void {
    if (this.zoomLevel() > 0.5) this.zoomLevel.update(z => z - 0.25);
  }

  rotateClockwise(): void {
    this.rotation.update(r => (r + 90) % 360);
  }

  resetTransform(): void {
    this.zoomLevel.set(1);
    this.rotation.set(0);
  }
}
