import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'management-province',
  imports: [RouterOutlet],
  templateUrl: './province.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Province {}
