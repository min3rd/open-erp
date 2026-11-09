import { Component, ElementRef, Input, inject } from '@angular/core';
import { TranslatePipe } from '@shared';

interface MenuContext {
  navigate?: (path: string) => void;
}

/**
 * Account-menu contribution (slot `core.layout.user-menu.items`). It only asks
 * the Core host to navigate; the workflow app itself owns the screen.
 */
@Component({
  selector: 'app-workflow-menu-item',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './workflow-menu-item.component.html',
})
export class WorkflowMenuItemComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input() context: MenuContext | null = null;

  open(): void {
    if (this.context?.navigate) {
      this.context.navigate('/apps/workflow');
      return;
    }
    this.host.nativeElement.dispatchEvent(
      new CustomEvent('op:navigate', {
        detail: { path: '/apps/workflow' },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

