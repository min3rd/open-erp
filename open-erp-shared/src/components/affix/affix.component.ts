import { Component, Input, Output, EventEmitter, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AffixPosition } from '../../enums/component.enum';

@Component({
  selector: 'erp-affix',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [style.height.px]="placeholderHeight" [class.hidden]="!isAffixed"></div>
    <div [class.fixed]="isAffixed"
         [class.z-30]="isAffixed"
         [style.top.px]="isAffixed && position === 'top' ? offsetTop : null"
         [style.bottom.px]="isAffixed && position === 'bottom' ? offsetBottom : null"
         [style.width.px]="isAffixed ? width : null"
         class="transition-all duration-200">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AffixComponent implements OnInit {
  @Input() offsetTop: number = 0;
  @Input() offsetBottom: number = 0;
  @Input() position: AffixPosition | 'top' | 'bottom' = AffixPosition.TOP;

  @Output() affixChange = new EventEmitter<boolean>();

  isAffixed: boolean = false;
  placeholderHeight: number = 0;
  width: number = 0;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.checkAffix();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  checkAffix(): void {
    if (typeof window === 'undefined') return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.placeholderHeight = rect.height;
    this.width = rect.width;

    let shouldAffix = false;
    if (this.position === 'top') {
      shouldAffix = rect.top <= this.offsetTop;
    } else {
      shouldAffix = window.innerHeight - rect.bottom <= this.offsetBottom;
    }

    if (shouldAffix !== this.isAffixed) {
      this.isAffixed = shouldAffix;
      this.affixChange.emit(this.isAffixed);
    }
  }
}
