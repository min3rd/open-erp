import { Component, DestroyRef, ElementRef, HostListener, effect, inject, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './drawer.component.html'
})
export class DrawerComponent {
  private static openStack: DrawerComponent[] = [];

  isOpen = input<boolean>(false);
  title = input<string>('');
  subtitle = input<string>('');
  width = input<string>('w-screen max-w-md');
  zIndex = input<number>(50);
  closeOnEscape = input<boolean>(true);
  shiftLeft = input<boolean>(false);

  close = output<void>();

  readonly titleId = `drawer-title-${Math.random().toString(36).substring(2, 9)}`;

  private panel = viewChild<ElementRef<HTMLElement>>('panel');
  private previouslyFocused: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      DrawerComponent.openStack = DrawerComponent.openStack.filter(drawer => drawer !== this);
    });

    effect(() => {
      const open = this.isOpen();
      if (open === this.wasOpen) {
        return;
      }
      this.wasOpen = open;

      if (open) {
        this.previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        DrawerComponent.openStack = DrawerComponent.openStack.filter(drawer => drawer !== this);
        DrawerComponent.openStack.push(this);
        queueMicrotask(() => this.focusFirstElement());
      } else {
        DrawerComponent.openStack = DrawerComponent.openStack.filter(drawer => drawer !== this);
        this.restoreFocus();
      }
    });
  }

  private get isTopMost(): boolean {
    return DrawerComponent.openStack[DrawerComponent.openStack.length - 1] === this;
  }

  panelClasses(): string {
    const base = 'bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col transform transition-transform ease-in-out duration-300';
    const shift = this.shiftLeft() ? '-translate-x-[30px]' : 'translate-x-0';
    return `${base} ${this.width()} ${shift}`.trim();
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick() {
    this.close.emit();
  }

  @HostListener('document:keydown', ['$event'])
  handleDocumentKeydown(event: KeyboardEvent) {
    if (!this.isOpen() || !this.isTopMost) {
      return;
    }

    if (event.key === 'Escape') {
      if (this.closeOnEscape()) {
        event.preventDefault();
        this.close.emit();
      }
      return;
    }

    if (event.key === 'Tab') {
      this.trapTab(event);
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const panel = this.panel()?.nativeElement;
    if (!panel) {
      return [];
    }
    return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter(element => !element.hasAttribute('disabled') && element.tabIndex !== -1);
  }

  private focusFirstElement() {
    if (!this.isOpen()) {
      return;
    }
    const [first] = this.getFocusableElements();
    first?.focus();
  }

  private trapTab(event: KeyboardEvent) {
    const panel = this.panel()?.nativeElement;
    if (!panel) {
      return;
    }

    const focusables = this.getFocusableElements();
    if (focusables.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const inside = !!active && panel.contains(active);

    if (event.shiftKey) {
      if (!inside || active === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (!inside || active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private restoreFocus() {
    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    if (target && document.contains(target)) {
      queueMicrotask(() => target.focus());
    }
  }
}
