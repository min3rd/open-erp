import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'management-ward',
  imports: [RouterOutlet],
  templateUrl: './ward.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ward {}
