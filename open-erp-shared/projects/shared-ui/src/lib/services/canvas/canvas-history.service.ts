import { Injectable } from '@angular/core';
import { CanvasState } from '../../models/canvas.model';

/**
 * CanvasHistoryService
 * Lớp dịch vụ quản lý hoàn tác/làm lại (Undo/Redo) cho thao tác thiết kế sơ đồ.
 */
@Injectable({ providedIn: 'root' })
export class CanvasHistoryService {
  private undoStack: CanvasState[] = [];
  private redoStack: CanvasState[] = [];
  private readonly maxStackSize = 30;

  pushState(state: CanvasState): void {
    const cloned = this.clone(state);

    // Tránh đẩy các trạng thái giống hệt nhau liên tiếp
    if (this.undoStack.length > 0) {
      const top = this.undoStack[this.undoStack.length - 1];
      if (this.isEqual(top, cloned)) return;
    }

    this.undoStack.push(cloned);
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Có hành động mới -> Reset Redo Stack
  }

  undo(currentState: CanvasState): { state: CanvasState | null; success: boolean } {
    if (this.undoStack.length === 0) {
      return { state: null, success: false };
    }

    // Đẩy trạng thái hiện tại vào Redo stack
    this.redoStack.push(this.clone(currentState));

    const prevState = this.undoStack.pop()!;
    return { state: prevState, success: true };
  }

  redo(currentState: CanvasState): { state: CanvasState | null; success: boolean } {
    if (this.redoStack.length === 0) {
      return { state: null, success: false };
    }

    // Đẩy trạng thái hiện tại vào Undo stack
    this.undoStack.push(this.clone(currentState));

    const nextState = this.redoStack.pop()!;
    return { state: nextState, success: true };
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private clone(state: CanvasState): CanvasState {
    return JSON.parse(JSON.stringify(state));
  }

  private isEqual(s1: CanvasState, s2: CanvasState): boolean {
    return (
      JSON.stringify(s1.nodes) === JSON.stringify(s2.nodes) &&
      JSON.stringify(s1.edges) === JSON.stringify(s2.edges)
    );
  }
}
