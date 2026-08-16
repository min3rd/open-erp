var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, signal, effect, inject } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { STORAGE_KEYS } from '../constants/permission.constant';
let ThemeService = class ThemeService {
    configService = inject(AppConfigService);
    isDarkMode = signal(false);
    constructor() {
        if (typeof localStorage !== 'undefined') {
            const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
            if (savedTheme) {
                this.isDarkMode.set(savedTheme === 'dark');
            }
            else {
                const defaultTheme = this.configService.themes().defaultTheme;
                const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.isDarkMode.set(defaultTheme === 'dark' || prefersDark);
            }
        }
        effect(() => {
            const dark = this.isDarkMode();
            if (typeof document !== 'undefined') {
                if (dark) {
                    document.documentElement.classList.add('dark');
                }
                else {
                    document.documentElement.classList.remove('dark');
                }
            }
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.THEME, dark ? 'dark' : 'light');
            }
            this.configService.applyThemePalette(dark);
        });
    }
    toggleTheme() {
        this.isDarkMode.update((prev) => !prev);
    }
};
ThemeService = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __metadata("design:paramtypes", [])
], ThemeService);
export { ThemeService };
//# sourceMappingURL=theme.service.js.map