import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { TranslocoModule } from '@jsverse/transloco';
import { OrderItem, StatusBadgeComponent } from '@open-erp/shared';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, TranslocoModule, StatusBadgeComponent],
  templateUrl: './orders.page.html'
})
export class OrdersPage {
  searchQuery = signal<string>('');
  selectedFilter = signal<string>('ALL');

  orders = signal<OrderItem[]>([
    { id: 'ORD-2026-001', customer: 'Tập đoàn ABC Tech', product: 'Gói ERP 50 seats Enterprise', amount: 125000000, status: 'COMPLETED', date: '16/08/2026' },
    { id: 'ORD-2026-002', customer: 'Công ty Cổ phần VinaGlobal', product: 'Module Kế toán & Quản lý Kho', amount: 78000000, status: 'PROCESSING', date: '16/08/2026' },
    { id: 'ORD-2026-003', customer: 'Logistics Hưng Thịnh', product: 'Dịch vụ Tích hợp API Kafka', amount: 45000000, status: 'COMPLETED', date: '15/08/2026' },
    { id: 'ORD-2026-004', customer: 'Minh Long Corp', product: 'Gia hạn License Tenant Multi-Branch', amount: 96000000, status: 'PENDING', date: '15/08/2026' }
  ]);

  filteredOrders() {
    return this.orders().filter(o => {
      const matchSearch = o.customer.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
                          o.id.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchStatus = this.selectedFilter() === 'ALL' || o.status === this.selectedFilter();
      return matchSearch && matchStatus;
    });
  }
}
