import { Component, input } from '@angular/core';

@Component({
  selector: 'oerp-card',
  standalone: true,
  templateUrl: './card.component.html'
})
export class CardComponent {
  title = input<string>('');
  subtitle = input<string>('');
}
