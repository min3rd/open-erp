import { Injectable, signal, effect } from '@angular/core';

export type NavMode = 'narrow' | 'sidebar';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly NAV_MODE_KEY = 'app.nav.mode';
  private readonly NAV_WIDTH_KEY = 'app.nav.width';
  private readonly MIN_NAV_WIDTH = 56;
  private readonly MAX_NAV_WIDTH = 320;
  private readonly DEFAULT_SIDEBAR_WIDTH = 280;

  // Sidebar visibility state
  private _sidebarVisible = signal(true);

  // Quick chat visibility state
  private _quickChatVisible = signal(false);

  // Navigation mode (narrow or sidebar)
  private _navMode = signal<NavMode>(this.loadNavMode());

  // Navigation width in pixels (for resizable sidebar)
  private _navWidth = signal<number>(this.loadNavWidth());

  get sidebarVisible() {
    return this._sidebarVisible.asReadonly();
  }

  get quickChatVisible() {
    return this._quickChatVisible.asReadonly();
  }

  get navMode() {
    return this._navMode.asReadonly();
  }

  get navWidth() {
    return this._navWidth.asReadonly();
  }

  get minNavWidth() {
    return this.MIN_NAV_WIDTH;
  }

  get maxNavWidth() {
    return this.MAX_NAV_WIDTH;
  }

  constructor() {
    // Persist nav mode changes
    effect(() => {
      const mode = this._navMode();
      this.saveNavMode(mode);
    });

    // Persist nav width changes
    effect(() => {
      const width = this._navWidth();
      this.saveNavWidth(width);
    });
  }

  toggleSidebar(): void {
    this._sidebarVisible.update((value) => !value);
  }

  setSidebarVisible(visible: boolean): void {
    this._sidebarVisible.set(visible);
  }

  toggleQuickChat(): void {
    this._quickChatVisible.update((value) => !value);
  }

  setQuickChatVisible(visible: boolean): void {
    this._quickChatVisible.set(visible);
  }

  toggleNavMode(): void {
    this._navMode.update((current) => (current === 'narrow' ? 'sidebar' : 'narrow'));
  }

  setNavMode(mode: NavMode): void {
    this._navMode.set(mode);
  }

  setNavWidth(width: number): void {
    // Clamp width between min and max
    const clampedWidth = Math.max(this.MIN_NAV_WIDTH, Math.min(width, this.MAX_NAV_WIDTH));
    this._navWidth.set(clampedWidth);
  }

  private loadNavMode(): NavMode {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'sidebar';
    }

    const stored = localStorage.getItem(this.NAV_MODE_KEY);
    return stored === 'narrow' || stored === 'sidebar' ? stored : 'sidebar';
  }

  private saveNavMode(mode: NavMode): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.NAV_MODE_KEY, mode);
    }
  }

  private loadNavWidth(): number {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.DEFAULT_SIDEBAR_WIDTH;
    }

    const stored = localStorage.getItem(this.NAV_WIDTH_KEY);
    if (stored) {
      const width = parseInt(stored, 10);
      if (!isNaN(width)) {
        return Math.max(this.MIN_NAV_WIDTH, Math.min(width, this.MAX_NAV_WIDTH));
      }
    }

    return this.DEFAULT_SIDEBAR_WIDTH;
  }

  private saveNavWidth(width: number): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.NAV_WIDTH_KEY, width.toString());
    }
  }
}
