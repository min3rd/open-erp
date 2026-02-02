import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { UserDto } from '../../interfaces/user.types';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'layout-user',
  imports: [CommonModule, SkeletonModule, AvatarModule, RippleModule, TooltipModule],
  templateUrl: './user.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class User implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  user!: UserDto | null;

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user) => {
      this.user = user;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
