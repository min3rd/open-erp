import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'shared-settings',
  imports: [],
  templateUrl: './settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings { }
