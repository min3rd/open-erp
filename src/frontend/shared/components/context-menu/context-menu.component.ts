import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterRenderEffect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ContextMenuItem } from '../../models/context-menu.model';
import { IconComponent } from '../icon/icon.component';
import { ContextMenuService, ContextMenuState } from './context-menu.service';

const VIEWPORT_MARGIN = 8;

/**
 * Overlay host for the shared context menu. Mount once per app shell
 * (`<app-context-menu />`) so the panel renders in the fixed overlay layer and
 * is never clipped by a table's `overflow-x-auto`. Desktop-only by design.
 */
@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [TranslatePipe, IconComponent],
  templateUrl: './context-menu.component.html',
  host: { class: 'contents' }
})
export class ContextMenuComponent {
  private service = inject(ContextMenuService);
  private panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly state = this.service.state;
  readonly activeIndex = signal(0);
  private lastMenu: ContextMenuState | null = null;

  constructor() {
    const close = () => {
      if (this.state()) {
        this.service.close();
      }
    };
    // Capture phase catches scrolls inside nested containers too.
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
    });

    afterRenderEffect(() => {
      const menu = this.state();
      if (!menu) {
        this.lastMenu = null;
        return;
      }
      const el = this.panel()?.nativeElement;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      let x = menu.x;
      let y = menu.y;
      if (x + rect.width > window.innerWidth - VIEWPORT_MARGIN) {
        x = Math.max(VIEWPORT_MARGIN, menu.x - rect.width);
      }
      if (y + rect.height > window.innerHeight - VIEWPORT_MARGIN) {
        y = Math.max(VIEWPORT_MARGIN, menu.y - rect.height);
      }
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      if (menu !== this.lastMenu) {
        this.lastMenu = menu;
        this.activeIndex.set(this.firstEnabledIndex(menu.items));
        this.focusActive();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const el = this.panel()?.nativeElement;
    if (el && !el.contains(event.target as Node)) {
      this.service.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const menu = this.state();
    if (!menu) {
      return;
    }
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.service.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(this.firstEnabledIndex(menu.items));
        this.focusActive();
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(this.lastEnabledIndex(menu.items));
        this.focusActive();
        break;
      case 'Tab':
        this.service.close();
        break;
      default:
        break;
    }
  }

  onItemClick(item: ContextMenuItem): void {
    if (item.disabled) {
      return;
    }
    // Close first so focus returns to the trigger before the drawer opens.
    this.service.close();
    item.action();
  }

  onItemHover(index: number): void {
    const item = this.state()?.items[index];
    if (item && !item.disabled) {
      this.activeIndex.set(index);
    }
  }

  itemClasses(item: ContextMenuItem): string {
    const base = 'flex w-full items-start gap-2 rounded-control px-2 py-1 text-start text-xs transition-colors';
    if (item.disabled) {
      return `${base} cursor-not-allowed text-muted opacity-60`;
    }
    if (item.danger) {
      return `${base} text-danger hover:bg-danger/10`;
    }
    return `${base} text-ink hover:bg-surface-muted`;
  }

  private move(step: number): void {
    const items = this.state()?.items ?? [];
    if (!items.length) {
      return;
    }
    let index = this.activeIndex();
    for (let i = 0; i < items.length; i++) {
      index = (index + step + items.length) % items.length;
      if (!items[index].disabled) {
        this.activeIndex.set(index);
        this.focusActive();
        return;
      }
    }
  }

  private firstEnabledIndex(items: ContextMenuItem[]): number {
    const index = items.findIndex((item) => !item.disabled);
    return index < 0 ? 0 : index;
  }

  private lastEnabledIndex(items: ContextMenuItem[]): number {
    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i].disabled) {
        return i;
      }
    }
    return 0;
  }

  private focusActive(): void {
    queueMicrotask(() => {
      const buttons = this.panel()?.nativeElement.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
      buttons?.[this.activeIndex()]?.focus();
    });
  }
}
