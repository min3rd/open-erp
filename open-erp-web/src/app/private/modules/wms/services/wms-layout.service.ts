import { Injectable, signal, effect } from '@angular/core';

export type NavMode = 'narrow' | 'sidebar';

@Injectable({
  providedIn: 'root',
})
export class WmsLayoutService {
  private readonly STORAGE_KEY = 'wms.nav.mode';
  private readonly DEFAULT_MODE: NavMode = 'sidebar';

  private _navMode = signal<NavMode>(this.loadNavMode());
  private _isMobile = signal(false);
  private _mobileMenuVisible = signal(false);

  get navMode() {
    return this._navMode.asReadonly();
  }

  get isMobile() {
    return this._isMobile.asReadonly();
  }

  get mobileMenuVisible() {
    return this._mobileMenuVisible.asReadonly();
  }

  constructor() {
    effect(() => {
      const mode = this._navMode();
      this.saveNavMode(mode);
    });
  }

  toggleNavMode(): void {
    this._navMode.update((current) => (current === 'narrow' ? 'sidebar' : 'narrow'));
  }

  setNavMode(mode: NavMode): void {
    this._navMode.set(mode);
  }

  setIsMobile(isMobile: boolean): void {
    this._isMobile.set(isMobile);
  }

  toggleMobileMenu(): void {
    this._mobileMenuVisible.update((value) => !value);
  }

  setMobileMenuVisible(visible: boolean): void {
    this._mobileMenuVisible.set(visible);
  }

  private loadNavMode(): NavMode {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.DEFAULT_MODE;
    }
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'narrow' || stored === 'sidebar' ? stored : this.DEFAULT_MODE;
  }

  private saveNavMode(mode: NavMode): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, mode);
    }
  }
}
