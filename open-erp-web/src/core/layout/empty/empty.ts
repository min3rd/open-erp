import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';

@Component({
  selector: 'layout-empty',
  imports: [RouterOutlet],
  templateUrl: './empty.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Empty implements OnDestroy {
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
