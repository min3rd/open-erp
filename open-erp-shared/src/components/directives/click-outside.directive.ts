import { Directive, ElementRef, output, HostListener, input } from '@angular/core';

@Directive({
  selector: '[erpClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  readonly clickOutsideEnabled = input<boolean>(true);
  readonly clickOutside = output<MouseEvent>({ alias: 'erpClickOutside' });

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.clickOutsideEnabled()) return;
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.clickOutside.emit(event);
    }
  }
}
