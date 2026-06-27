export interface DndItem<T = unknown> {
  id: string;
  type: string;          // Dùng để filter drop zones
  data: T;               // Payload tùy ý
  label?: string;        // Nhãn hiển thị khi kéo
  icon?: string;         // Icon hiển thị trong ghost
}

export interface DropEvent<T = unknown> {
  item: DndItem<T>;
  sourceZoneId: string;
  targetZoneId: string;
  previousIndex: number;
  currentIndex: number;
  dropPosition?: { x: number; y: number }; // Cho free-form canvas
}

export interface SortEvent<T = unknown> {
  items: DndItem<T>[];   // Danh sách sau khi đã sắp xếp lại
  movedItem: DndItem<T>;
  previousIndex: number;
  currentIndex: number;
}
