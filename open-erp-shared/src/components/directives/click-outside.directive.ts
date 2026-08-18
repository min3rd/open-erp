import { Directive, ElementRef, Output, EventEmitter, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[erpClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Input() clickOutsideEnabled: boolean = true;
  @Output('erpClickOutside') clickOutside = new EventEmitter<MouseEvent>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.clickOutsideEnabled) return;
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.clickOutside.emit(event);
    }
  }
}
