import { Component, ChangeDetectionStrategy, input, output, HostListener, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'erp-resizable',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm"
         [style.width.px]="currentWidth()"
         [style.height.px]="currentHeight()">
      
      <!-- User Inner Content -->
      <div class="w-full h-full p-4 overflow-auto custom-scrollbar">
        <ng-content></ng-content>
      </div>

      <!-- Right Resize Handle -->
      @if (enableRight()) {
        <div (mousedown)="startResize($event, 'right')"
             class="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-indigo-500/30 transition-colors"></div>
      }

      <!-- Bottom Resize Handle -->
      @if (enableBottom()) {
        <div (mousedown)="startResize($event, 'bottom')"
             class="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-indigo-500/30 transition-colors"></div>
      }

      <!-- Bottom-Right Corner Handle -->
      @if (enableCorner()) {
        <div (mousedown)="startResize($event, 'corner')"
             class="absolute bottom-1 right-1 w-3.5 h-3.5 cursor-nwse-resize flex items-end justify-end p-0.5 opacity-40 hover:opacity-100 transition-opacity">
          <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor" class="text-slate-500 dark:text-slate-400">
            <path d="M6 6H0L6 0V6Z" />
          </svg>
        </div>
      }

    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class ResizableComponent implements OnInit {
  readonly initialWidth = input<number>(320);
  readonly initialHeight = input<number>(200);
  readonly minWidth = input<number>(160);
  readonly minHeight = input<number>(100);
  readonly maxWidth = input<number>(800);
  readonly maxHeight = input<number>(600);
  readonly enableRight = input<boolean>(true);
  readonly enableBottom = input<boolean>(true);
  readonly enableCorner = input<boolean>(true);

  readonly resizeEnd = output<{ width: number; height: number }>();

  currentWidth = signal<number>(320);
  currentHeight = signal<number>(200);

  private resizingDirection: 'right' | 'bottom' | 'corner' | null = null;
  private startX = 0;
  private startY = 0;
  private startW = 0;
  private startH = 0;

  ngOnInit(): void {
    this.currentWidth.set(this.initialWidth());
    this.currentHeight.set(this.initialHeight());
  }

  startResize(event: MouseEvent, dir: 'right' | 'bottom' | 'corner'): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizingDirection = dir;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startW = this.currentWidth();
    this.startH = this.currentHeight();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.resizingDirection) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    if (this.resizingDirection === 'right' || this.resizingDirection === 'corner') {
      const nextW = this.startW + deltaX;
      this.currentWidth.set(Math.max(this.minWidth(), Math.min(this.maxWidth(), nextW)));
    }

    if (this.resizingDirection === 'bottom' || this.resizingDirection === 'corner') {
      const nextH = this.startH + deltaY;
      this.currentHeight.set(Math.max(this.minHeight(), Math.min(this.maxHeight(), nextH)));
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.resizingDirection) {
      this.resizingDirection = null;
      this.resizeEnd.emit({ width: this.currentWidth(), height: this.currentHeight() });
    }
  }
}
