import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Empty } from './empty/empty';
import { Horizontal } from './horizontal/horizontal';
import { Vertical } from './vertical/vertical';
import { UserConfigDto } from '../interfaces/config.types';
import { ConfigService } from '../services/config-service';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [Empty, Horizontal, Vertical],
  templateUrl: './layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout implements OnInit, OnDestroy {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  config!: UserConfigDto;

  ngOnInit(): void {
    this.configService.config$.pipe(takeUntil(this._unsubscribeAll)).subscribe((config) => {
      if (!config) {
        this._updateLayout();
        return;
      }
      this.config = config;
      this._updateLayout();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  private _updateLayout(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const paths = route.pathFromRoot;
    paths.forEach((path) => {
      const layout = path.snapshot.data['layout'];
      if (layout) {
        this.config = { ...this.config, layout };
      }
    });
  }
}
