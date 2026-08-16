import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { TranslocoModule } from '@jsverse/transloco';
import { UserItem, AvatarComponent, StatusBadgeComponent } from '@open-erp/shared';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, TranslocoModule, AvatarComponent, StatusBadgeComponent],
  templateUrl: './users.page.html'
})
export class UsersPage {
  searchQuery = signal<string>('');

  users = signal<UserItem[]>([
    { id: 1, username: 'admin', fullName: 'Quản trị viên Hệ thống', email: 'admin@vn9melody.com', department: 'Executive Board', roles: ['SUPER_ADMIN'], status: 'ACTIVE', lastLogin: '16/08/2026 15:10' },
    { id: 2, username: 'sales_lead', fullName: 'Nguyễn Văn Minh', email: 'minh.nv@vn9melody.com', department: 'Sales Department', roles: ['SALES_MANAGER'], status: 'ACTIVE', lastLogin: '16/08/2026 14:22' },
    { id: 3, username: 'accountant_01', fullName: 'Trần Thị Thu Thảo', email: 'thao.tt@vn9melody.com', department: 'Accounting', roles: ['ACCOUNTANT'], status: 'ACTIVE', lastLogin: '15/08/2026 09:30' },
    { id: 4, username: 'warehouse_op', fullName: 'Lê Hoàng Nam', email: 'nam.lh@vn9melody.com', department: 'Warehouse & Logistics', roles: ['WAREHOUSE_STAFF'], status: 'INACTIVE', lastLogin: '10/08/2026 16:45' }
  ]);

  filteredUsers() {
    return this.users().filter(u => {
      return u.fullName.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
             u.username.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
             u.department.toLowerCase().includes(this.searchQuery().toLowerCase());
    });
  }
}
