import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../core/services/auth.service';

export interface OrderItem {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING';
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  authService = inject(AuthService);
  private http = inject(HttpClient);

  stats = signal({
    revenue: 485900000,
    ordersCount: 142,
    activeUsersCount: 28,
    systemUptime: '99.98%'
  });

  recentOrders = signal<OrderItem[]>([
    { id: 'ORD-2026-001', customer: 'Tập đoàn ABC Tech', product: 'Gói ERP Doanh nghiệp 50 seats', amount: 125000000, status: 'COMPLETED', date: '16/08/2026' },
    { id: 'ORD-2026-002', customer: 'Công ty Cổ phần VinaGlobal', product: 'Module Kế toán & Quản lý Kho', amount: 78000000, status: 'PROCESSING', date: '16/08/2026' },
    { id: 'ORD-2026-003', customer: 'Logistics Hưng Thịnh', product: 'Dịch vụ Tích hợp API Kafka', amount: 45000000, status: 'COMPLETED', date: '15/08/2026' },
    { id: 'ORD-2026-004', customer: 'Minh Long Corp', product: 'Gia hạn License Tenant Multi-Branch', amount: 96000000, status: 'PENDING', date: '15/08/2026' }
  ]);
}
