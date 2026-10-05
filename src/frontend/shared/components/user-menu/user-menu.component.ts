import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';
import { TranslatePipe } from '../../i18n/translate.pipe';

/**
 * Account menu: the user name is the only topbar control, and theme/language
 * selectors plus account/logout live in the popup. Keeps the topbar compact
 * instead of showing three separate inline control groups.
 */
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [RouterLink, LanguageSwitcherComponent, ThemeSwitcherComponent, TranslatePipe],
  templateUrl: './user-menu.component.html'
})
export class UserMenuComponent {
  private host = inject(ElementRef<HTMLElement>);

  userName = input<string>('');
  userEmail = input<string>('');
  showAccount = input<boolean>(true);
  settingsPath = input<string | null>(null);
  platformPath = input<string | null>(null);

  openAccount = output<void>();
  logout = output<void>();

  readonly open = signal(false);
  readonly displayName = computed(() => this.userName() || this.userEmail());
  readonly initial = computed(() => (this.displayName() || 'U').charAt(0).toUpperCase());

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

  onLogout(): void {
    this.open.set(false);
    this.logout.emit();
  }
}
