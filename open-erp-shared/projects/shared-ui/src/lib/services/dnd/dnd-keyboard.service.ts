import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * DndKeyboardService
 * Hỗ trợ các hành động điều hướng và thao tác kéo thả bằng bàn phím (WCAG 2.1 AA Accessibility).
 * - Space: Bắt đầu cầm (pickup) / Thả (drop)
 * - ArrowUp/ArrowLeft: Di chuyển lên trên/sang trái
 * - ArrowDown/ArrowRight: Di chuyển xuống dưới/sang phải
 * - Escape: Hủy kéo thả
 */
@Injectable({ providedIn: 'root' })
export class DndKeyboardService {
  private activeIndex: number | null = null;
  private listItems: unknown[] = [];

  readonly movement = new Subject<{ previousIndex: number; currentIndex: number }>();
  readonly dragCancelled = new Subject<void>();
  readonly dragCompleted = new Subject<{ finalIndex: number }>();

  start(index: number, items: unknown[]): void {
    this.activeIndex = index;
    this.listItems = [...items];
  }

  handleKey(event: KeyboardEvent): boolean {
    if (this.activeIndex === null) return false;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        if (this.activeIndex > 0) {
          const prev = this.activeIndex;
          this.activeIndex--;
          this.swap(prev, this.activeIndex);
          this.movement.next({ previousIndex: prev, currentIndex: this.activeIndex });
          event.preventDefault();
          return true;
        }
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        if (this.activeIndex < this.listItems.length - 1) {
          const prev = this.activeIndex;
          this.activeIndex++;
          this.swap(prev, this.activeIndex);
          this.movement.next({ previousIndex: prev, currentIndex: this.activeIndex });
          event.preventDefault();
          return true;
        }
        break;
      case 'Escape':
        this.cancel();
        event.preventDefault();
        return true;
      case 'Enter':
      case ' ':
        this.complete();
        event.preventDefault();
        return true;
    }
    return false;
  }

  cancel(): void {
    if (this.activeIndex !== null) {
      this.activeIndex = null;
      this.listItems = [];
      this.dragCancelled.next();
    }
  }

  private complete(): void {
    if (this.activeIndex !== null) {
      const finalIndex = this.activeIndex;
      this.activeIndex = null;
      this.listItems = [];
      this.dragCompleted.next({ finalIndex });
    }
  }

  isDragging(): boolean {
    return this.activeIndex !== null;
  }

  private swap(i: number, j: number): void {
    const temp = this.listItems[i];
    this.listItems[i] = this.listItems[j];
    this.listItems[j] = temp;
  }
}
