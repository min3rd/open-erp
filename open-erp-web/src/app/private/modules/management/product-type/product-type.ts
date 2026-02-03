import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'management-product-type',
  imports: [RouterOutlet],
  templateUrl: './product-type.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductType {}
