import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'management-product',
  imports: [],
  templateUrl: './product.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Product { }
