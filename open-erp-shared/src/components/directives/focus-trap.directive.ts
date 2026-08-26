import { Directive, ElementRef, HostListener, input, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[erpFocusTrap]',
  standalone: true
})
export class FocusTrapDirective implements AfterViewInit {
  readonly enabled = input<boolean>(true, { alias: 'erpFocusTrap' });

  private focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    if (this.enabled()) {
      this.focusFirstElement();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.enabled() || event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  private getFocusableElements(): HTMLElement[] {
    return Array.from(this.el.nativeElement.querySelectorAll(this.focusableSelector));
  }

  private focusFirstElement(): void {
    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }
}
