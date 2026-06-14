import { Component, input, effect, ElementRef, viewChild } from '@angular/core';
import feather from 'feather-icons';

@Component({
  selector: 'oerp-icon',
  standalone: true,
  host: {
    class: 'inline-flex items-center justify-center'
  },
  templateUrl: './icon.component.html'
})
export class IconComponent {
  name = input.required<string>();
  size = input<number>(24);
  color = input<string>('currentColor');
  strokeWidth = input<number>(2);

  iconContainer = viewChild<ElementRef<HTMLSpanElement>>('iconContainer');

  constructor() {
    effect(() => {
      const nameVal = this.name();
      const sizeVal = this.size();
      const colorVal = this.color();
      const strokeWidthVal = this.strokeWidth();
      const container = this.iconContainer()?.nativeElement;

      if (container) {
        const icon = (feather.icons as any)[nameVal];
        if (icon) {
          container.innerHTML = icon.toSvg({
            width: sizeVal,
            height: sizeVal,
            stroke: colorVal,
            'stroke-width': strokeWidthVal
          });
        } else {
          container.innerHTML = '';
          console.warn(`Icon "${nameVal}" not found in feather-icons.`);
        }
      }
    });
  }
}
