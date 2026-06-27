import { Injectable, signal } from '@angular/core';
import { DndItem } from '../../models/dnd.model';

/**
 * DndStateService
 * Lưu trữ trạng thái kéo thả hiện tại (item đang kéo, nguồn kéo, tọa độ con trỏ) sử dụng Angular Signal.
 */
@Injectable({ providedIn: 'root' })
export class DndStateService {
  readonly currentDragItem = signal<DndItem | null>(null);
  readonly currentSourceZoneId = signal<string | null>(null);
  readonly currentPointerPosition = signal<{ x: number; y: number } | null>(null);

  startDrag(item: DndItem, sourceZoneId: string): void {
    this.currentDragItem.set(item);
    this.currentSourceZoneId.set(sourceZoneId);
  }

  updatePointerPosition(x: number, y: number): void {
    this.currentPointerPosition.set({ x, y });
  }

  endDrag(): void {
    this.currentDragItem.set(null);
    this.currentSourceZoneId.set(null);
    this.currentPointerPosition.set(null);
  }
}
