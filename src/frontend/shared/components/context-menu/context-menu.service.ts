import { Injectable, signal } from '@angular/core';
import { ContextMenuItem } from '../../models/context-menu.model';

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
  ariaLabelKey: string;
  trigger: HTMLElement | null;
}

/**
 * Single source of truth for the one context menu. The `ContextMenuComponent`
 * host is mounted once per app shell (web only) and reacts to this signal;
 * callers (the `appContextMenuTrigger` directive or the shared table) only
 * describe position + items.
 */
@Injectable({ providedIn: 'root' })
export class ContextMenuService {
  private stateSignal = signal<ContextMenuState | null>(null);
  readonly state = this.stateSignal.asReadonly();

  open(config: {
    x: number;
    y: number;
    items: ContextMenuItem[];
    ariaLabelKey?: string;
    trigger?: HTMLElement | null;
  }): void {
    this.stateSignal.set({
      x: config.x,
      y: config.y,
      items: config.items,
      ariaLabelKey: config.ariaLabelKey || 'COMMON_CONTEXT_MENU',
      trigger: config.trigger ?? null
    });
  }

  /** Closes the menu and restores focus to the triggering row. */
  close(): void {
    const state = this.stateSignal();
    this.stateSignal.set(null);
    if (state?.trigger && document.contains(state.trigger)) {
      state.trigger.focus();
    }
  }
}
