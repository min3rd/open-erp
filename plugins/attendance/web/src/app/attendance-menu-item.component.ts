import { Component, ElementRef, Input, inject } from '@angular/core';
import { TranslatePipe } from '@shared';

interface MenuContext {
  navigate?: (path: string) => void;
}

@Component({
  selector: 'app-attendance-menu-item',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './attendance-menu-item.component.html',
})
export class AttendanceMenuItemComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input() context: MenuContext | null = null;

  open(): void {
    if (this.context?.navigate) {
      this.context.navigate('/apps/attendance');
      return;
    }
    this.host.nativeElement.dispatchEvent(
      new CustomEvent('op:navigate', {
        detail: { path: '/apps/attendance' },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

