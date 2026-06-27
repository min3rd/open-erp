import { Injectable } from '@angular/core';

/**
 * DndAutoScrollService
 * Tự động cuộn trang hoặc cuộn container khi con trỏ chuột/chạm di chuyển gần đến rìa.
 */
@Injectable({ providedIn: 'root' })
export class DndAutoScrollService {
  private scrollInterval: any = null;
  private readonly thresholdPx = 60; // Khoảng cách tới rìa để kích hoạt cuộn
  private readonly scrollSpeed = 12;  // Tốc độ cuộn (px mỗi tick)

  checkAndScroll(container: HTMLElement, x: number, y: number): void {
    this.stop();

    const rect = container.getBoundingClientRect();
    const topDiff = y - rect.top;
    const bottomDiff = rect.bottom - y;
    const leftDiff = x - rect.left;
    const rightDiff = rect.right - x;

    let scrollX = 0;
    let scrollY = 0;

    if (topDiff >= 0 && topDiff < this.thresholdPx) {
      scrollY = -this.scrollSpeed;
    } else if (bottomDiff >= 0 && bottomDiff < this.thresholdPx) {
      scrollY = this.scrollSpeed;
    }

    if (leftDiff >= 0 && leftDiff < this.thresholdPx) {
      scrollX = -this.scrollSpeed;
    } else if (rightDiff >= 0 && rightDiff < this.thresholdPx) {
      scrollX = this.scrollSpeed;
    }

    if (scrollX !== 0 || scrollY !== 0) {
      this.scrollInterval = setInterval(() => {
        if (scrollY !== 0) container.scrollTop += scrollY;
        if (scrollX !== 0) container.scrollLeft += scrollX;
      }, 16);
    }
  }

  stop(): void {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }
}
