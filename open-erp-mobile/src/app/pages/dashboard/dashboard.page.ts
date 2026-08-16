import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService, OrderItem } from '@open-erp/shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonRefresher, IonRefresherContent, TranslocoModule],
  templateUrl: './dashboard.page.html'
})
export class DashboardPage {
  authService = inject(AuthService);

  stats = signal({
    revenue: 485900000,
    ordersCount: 142,
    activeUsersCount: 28,
    systemUptime: '99.98%'
  });

  recentOrders = signal<OrderItem[]>([
    { id: 'ORD-2026-001', customer: 'ABC Tech Group', product: 'ERP License 50 seats', amount: 125000000, status: 'COMPLETED', date: '16/08' },
    { id: 'ORD-2026-002', customer: 'VinaGlobal Corp', product: 'Accounting & Warehouse', amount: 78000000, status: 'PROCESSING', date: '16/08' },
    { id: 'ORD-2026-003', customer: 'Hưng Thịnh Logistics', product: 'Kafka Integration API', amount: 45000000, status: 'COMPLETED', date: '15/08' }
  ]);

  handleRefresh(event: any): void {
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
