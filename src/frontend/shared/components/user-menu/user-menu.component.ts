import { Component, ElementRef, HostListener, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';
import { TenantSwitcherComponent, TenantSwitcherItem } from '../tenant-switcher/tenant-switcher.component';
import { IconComponent } from '../icon/icon.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PluginContext } from '../../plugin-host/plugin-host.model';
import { PluginSlotComponent } from '../../plugin-host/plugin-slot/plugin-slot.component';
import { PluginHostService } from '../../plugin-host/plugin-host.service';

/**
 * Account menu: the user name is the only topbar control, and theme/language
 * selectors plus account/logout live in the popup. Keeps the topbar compact
 * instead of showing three separate inline control groups.
 */
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [RouterLink, LanguageSwitcherComponent, ThemeSwitcherComponent, TenantSwitcherComponent, IconComponent, TranslatePipe, PluginSlotComponent],
  templateUrl: './user-menu.component.html'
})
export class UserMenuComponent implements OnInit {
  private host = inject(ElementRef<HTMLElement>);
  private pluginHost = inject(PluginHostService);

  userName = input<string>('');
  userEmail = input<string>('');
  showAccount = input<boolean>(true);
  settingsPath = input<string | null>(null);
  platformPath = input<string | null>(null);
  tenants = input<TenantSwitcherItem[]>([]);
  currentTenantId = input<string | null>(null);
  pluginContext = input<PluginContext | null>(null);

  openAccount = output<void>();
  logout = output<void>();
  switchTenant = output<string>();
  pluginNavigate = output<string>();

  readonly open = signal(false);
  readonly displayName = computed(() => this.userName() || this.userEmail());
  readonly initial = computed(() => (this.displayName() || 'U').charAt(0).toUpperCase());

  ngOnInit(): void {
    if (!this.pluginHost.manifest()) {
      void this.pluginHost.loadManifest();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  toggle(): void {
    this.open.update((value) => !value);
  }

  onAccount(): void {
    this.open.set(false);
    this.openAccount.emit();
  }

  onSwitchTenant(tenantId: string): void {
    this.open.set(false);
    this.switchTenant.emit(tenantId);
  }

  onPluginNavigate(path: string): void {
    this.open.set(false);
    this.pluginNavigate.emit(path);
  }

  onLogout(): void {
    this.open.set(false);
    this.logout.emit();
  }
}
