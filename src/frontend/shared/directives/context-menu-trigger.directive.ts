import { Directive, ElementRef, HostListener, computed, inject, input } from '@angular/core';
import { ContextMenuItem } from '../models/context-menu.model';
import { ContextMenuService } from '../components/context-menu/context-menu.service';

/**
 * Attach to a list row / card: opens the shared context menu on right-click and
 * on the keyboard `Shift+F10` / `ContextMenu` key, anchored to that element.
 * `preventDefault()` is applied only on the host, so the native browser menu
 * still works everywhere else on the page.
 */
@Directive({
  selector: '[appContextMenuTrigger]',
  standalone: true,
  host: {
    '[attr.tabindex]': 'appContextMenuTrigger().length ? 0 : null',
    '[attr.aria-haspopup]': "appContextMenuTrigger().length ? 'menu' : null",
    '[attr.aria-expanded]': "expanded() ? 'true' : 'false'"
  }
})
export class ContextMenuTriggerDirective {
  private host = inject(ElementRef<HTMLElement>);
  private service = inject(ContextMenuService);

  readonly appContextMenuTrigger = input<ContextMenuItem[]>([]);

  readonly expanded = computed(() => this.service.state()?.trigger === this.host.nativeElement);

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (!this.appContextMenuTrigger().length) {
      return;
    }
    // AC-10: desktop only — a long-press on a touch device must not open the
    // menu (mobile keeps its buttons/flows). Mouse and pen still open it.
    if ((event as PointerEvent).pointerType === 'touch') {
      return;
    }
    event.preventDefault();
    this.open(event.clientX, event.clientY);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const keyboardOpen = event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey);
    if (!keyboardOpen || !this.appContextMenuTrigger().length) {
      return;
    }
    event.preventDefault();
    const rect = this.host.nativeElement.getBoundingClientRect();
    this.open(rect.left, rect.bottom);
  }

  private open(x: number, y: number): void {
    const trigger = this.host.nativeElement;
    trigger.focus();
    this.service.open({
      x,
      y,
      items: this.appContextMenuTrigger(),
      trigger
    });
  }
}
