import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'management-product',
  imports: [RouterOutlet],
  templateUrl: './product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Product {}
