import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService, OrderItem, KpiCardComponent, StatusBadgeComponent } from '@open-erp/shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslocoModule, KpiCardComponent, StatusBadgeComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  authService = inject(AuthService);

  stats = signal({
    revenue: '485.900.000 ₫',
    ordersCount: '142',
    activeUsersCount: '28',
    systemUptime: '99.98%'
  });

  recentOrders = signal<OrderItem[]>([
    { id: 'ORD-2026-001', customer: 'Tập đoàn ABC Tech', product: 'Gói ERP Doanh nghiệp 50 seats', amount: 125000000, status: 'COMPLETED', date: '16/08/2026' },
    { id: 'ORD-2026-002', customer: 'Công ty Cổ phần VinaGlobal', product: 'Module Kế toán & Quản lý Kho', amount: 78000000, status: 'PROCESSING', date: '16/08/2026' },
    { id: 'ORD-2026-003', customer: 'Logistics Hưng Thịnh', product: 'Dịch vụ Tích hợp API Kafka', amount: 45000000, status: 'COMPLETED', date: '15/08/2026' },
    { id: 'ORD-2026-004', customer: 'Minh Long Corp', product: 'Gia hạn License Tenant Multi-Branch', amount: 96000000, status: 'PENDING', date: '15/08/2026' }
  ]);
}
