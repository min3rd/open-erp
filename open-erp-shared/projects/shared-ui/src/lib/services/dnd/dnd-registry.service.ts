import { Injectable } from '@angular/core';

/**
 * DndRegistryService
 * Quản lý tập trung các vùng Drop Zone đã được đăng ký và các liên kết (connection) giữa chúng
 * phục vụ kéo thả giữa nhiều danh sách (multi-list transfer).
 */
@Injectable({ providedIn: 'root' })
export class DndRegistryService {
  private readonly registry = new Map<string, string[]>();

  register(zoneId: string, connectedTo: string[] = []): void {
    this.registry.set(zoneId, connectedTo);
  }

  unregister(zoneId: string): void {
    this.registry.delete(zoneId);
  }

  getConnectedTo(zoneId: string): string[] {
    return this.registry.get(zoneId) || [];
  }

  updateConnections(zoneId: string, connectedTo: string[]): void {
    if (this.registry.has(zoneId)) {
      this.registry.set(zoneId, connectedTo);
    }
  }
}
