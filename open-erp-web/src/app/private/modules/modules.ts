import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'module-modules',
  imports: [RouterOutlet],
  templateUrl: './modules.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modules {}
