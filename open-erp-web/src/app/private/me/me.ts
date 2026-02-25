import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-me',
  imports: [],
  templateUrl: './me.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Me { }
