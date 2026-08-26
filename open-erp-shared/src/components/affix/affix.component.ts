import { Component, ChangeDetectionStrategy, input, output, ElementRef, HostListener, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AffixPosition } from '../../enums/component.enum';

@Component({
  selector: 'erp-affix',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [style.height.px]="placeholderHeight()" [class.hidden]="!isAffixed()"></div>
    <div [class.fixed]="isAffixed()"
         [class.z-30]="isAffixed()"
         [style.top.px]="isAffixed() && isTop() ? offsetTop() : null"
         [style.bottom.px]="isAffixed() && !isTop() ? offsetBottom() : null"
         [style.width.px]="isAffixed() ? width() : null"
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
  readonly offsetTop = input<number>(0);
  readonly offsetBottom = input<number>(0);
  readonly position = input<AffixPosition | 'top' | 'bottom'>(AffixPosition.TOP);

  readonly affixChange = output<boolean>();

  isAffixed = signal<boolean>(false);
  placeholderHeight = signal<number>(0);
  width = signal<number>(0);

  readonly isTop = computed(() => {
    const p = String(this.position()).toLowerCase();
    return p === 'top';
  });

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.checkAffix();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  checkAffix(): void {
    if (typeof window === 'undefined') return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.placeholderHeight.set(rect.height);
    this.width.set(rect.width);

    let shouldAffix = false;
    if (this.isTop()) {
      shouldAffix = rect.top <= this.offsetTop();
    } else {
      shouldAffix = window.innerHeight - rect.bottom <= this.offsetBottom();
    }

    if (shouldAffix !== this.isAffixed()) {
      this.isAffixed.set(shouldAffix);
      this.affixChange.emit(shouldAffix);
    }
  }
}
