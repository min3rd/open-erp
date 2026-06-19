import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService, IconComponent, ButtonComponent } from '@open-erp/shared';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  module: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoModule,
    IconComponent,
  ],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private translocoService = inject(TranslocoService);
  private authService = inject(AuthService);

  layoutType = signal<'vertical' | 'horizontal'>('vertical');
  isCollapsed = signal<boolean>(false);
  isDarkMode = signal<boolean>(false);
  currentLang = signal<string>('vi');
  
  menuItems = signal<MenuItem[]>([]);
  isMobileMenuOpen = signal<boolean>(false);

  ngOnInit() {
    // 1. Load layout preferences
    const savedLayout = localStorage.getItem('layout_type');
    if (savedLayout === 'horizontal') {
      this.layoutType.set('horizontal');
    }

    const savedSidebar = localStorage.getItem('sidebar_state');
    if (savedSidebar === 'collapsed') {
      this.isCollapsed.set(true);
    }

    // 2. Load theme preferences
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.isDarkMode.set(savedTheme === 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Load language preferences
    const savedLang = localStorage.getItem('lang') || 'vi';
    this.translocoService.setActiveLang(savedLang);
    this.currentLang.set(savedLang);

    // 4. Fetch menu dynamically from Backend
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
        console.error('Failed to load menu', err);
      },
    });
  }

  toggleLayout() {
    const nextLayout = this.layoutType() === 'vertical' ? 'horizontal' : 'vertical';
    this.layoutType.set(nextLayout);
    localStorage.setItem('layout_type', nextLayout);
  }

  toggleSidebar() {
    const nextState = !this.isCollapsed();
    this.isCollapsed.set(nextState);
    localStorage.setItem('sidebar_state', nextState ? 'collapsed' : 'expanded');
  }

  toggleDarkMode() {
    const nextDark = !this.isDarkMode();
    this.isDarkMode.set(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  changeLanguage(event: Event) {
    const select = event.target as HTMLSelectElement;
    const lang = select.value;
    this.translocoService.setActiveLang(lang);
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
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
