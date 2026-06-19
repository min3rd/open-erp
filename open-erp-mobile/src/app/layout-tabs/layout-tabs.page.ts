import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonMenuToggle,
  IonSplitPane
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, gitMerge, settings, logOut, menu, close } from 'ionicons/icons';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService, HasPermissionDirective } from '@open-erp/shared';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  module: string;
}

@Component({
  selector: 'app-layout-tabs',
  templateUrl: 'layout-tabs.page.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonIcon,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonMenuToggle,
    IonSplitPane,
    TranslocoModule,
    HasPermissionDirective,
  ],
})
export class LayoutTabsPage implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  menuItems = signal<MenuItem[]>([]);

  constructor() {
    addIcons({ home, gitMerge, settings, logOut, menu, close });
  }

  ngOnInit() {
    this.fetchMenu();
  }

  fetchMenu() {
    const url = '/api/v1/auth/menu';
    this.http.get<{ success: boolean; data: MenuItem[] }>(url).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.menuItems.set(res.data);
        }
      },
      error: (err) => {
        console.error('Failed to load mobile menu', err);
      },
    });
  }

  getIonicIcon(icon: string): string {
    if (icon === 'home') return 'home';
    if (icon === 'git-merge') return 'git-merge';
    if (icon === 'settings') return 'settings';
    return 'menu';
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
