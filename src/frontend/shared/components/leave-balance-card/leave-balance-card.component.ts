import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n';

@Component({
  selector: 'app-leave-balance-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './leave-balance-card.component.html'
})
export class LeaveBalanceCardComponent {
  leaveTypeName = input<string>('');
  granted = input<number>(0);
  used = input<number>(0);
  remaining = input<number>(0);
  expiring = input<number>(0);
  validUntil = input<string | null>(null);
}

