import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '../../../../../core/services/organization-service';

@Component({
  selector: 'accept-invite',
  imports: [CommonModule, TranslocoModule, ButtonModule, CardModule],
  templateUrl: './accept-invite.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptInvite implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private organizationService = inject(OrganizationService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly accepting = signal(false);
  readonly accepted = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasToken = signal(false);

  private token: string | null = null;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.error.set('Liên kết mời không hợp lệ hoặc đã hết hạn.');
      this.loading.set(false);
    } else {
      this.hasToken.set(true);
      this.loading.set(false);
    }
  }

  onAccept(): void {
    if (!this.token) return;

    this.accepting.set(true);
    this.error.set(null);

    this.organizationService.acceptInvitation(this.token).subscribe({
      next: () => {
        this.accepting.set(false);
        this.accepted.set(true);
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Bạn đã tham gia tổ chức thành công!',
        });
        setTimeout(() => {
          this.router.navigate(['/modules/organization']);
        }, 2000);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.accepting.set(false);
        const detail = err?.error?.message ?? err?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.';
        this.error.set(detail);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail,
        });
        this.cdr.markForCheck();
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/modules/organization']);
  }
}
