import { Component, ChangeDetectionStrategy, input, model, output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  title: string;
  color?: string;
  badge?: string;
}

export interface CalendarDay {
  day: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

@Component({
  selector: 'erp-calendar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './calendar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CalendarComponent implements OnInit {
  readonly selectedDate = model<string | undefined>(undefined);
  readonly events = input<CalendarEvent[]>([]);
  readonly bordered = input<boolean>(true);

  readonly dateSelect = output<string>();
  readonly monthChange = output<{ month: number; year: number }>();

  currentMonth = signal<number>(new Date().getMonth());
  currentYear = signal<number>(new Date().getFullYear());
  weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  readonly monthLabel = computed(() => {
    return `${MONTH_NAMES[this.currentMonth()]} ${this.currentYear()}`;
  });

  readonly daysMatrix = computed<CalendarDay[]>(() => {
    const m = this.currentMonth();
    const y = this.currentYear();
    const sel = this.selectedDate();
    const evts = this.events();

    const matrix: CalendarDay[] = [];
    const today = new Date();
    const todayStr = this.formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

    const firstDayIndex = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = m === 0 ? 12 : m;
      const prevY = m === 0 ? y - 1 : y;
      const dateStr = this.formatDate(prevY, prevM, d);
      matrix.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === sel,
        events: evts.filter(e => e.date === dateStr)
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this.formatDate(y, m + 1, d);
      matrix.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === sel,
        events: evts.filter(e => e.date === dateStr)
      });
    }

    // Next month filler days (to fill 35 or 42 grid cells)
    const remaining = (7 - (matrix.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = m === 11 ? 1 : m + 2;
      const nextY = m === 11 ? y + 1 : y;
      const dateStr = this.formatDate(nextY, nextM, d);
      matrix.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === sel,
        events: evts.filter(e => e.date === dateStr)
      });
    }

    return matrix;
  });

  ngOnInit(): void {
    const sel = this.selectedDate();
    if (sel) {
      const d = new Date(sel);
      if (!isNaN(d.getTime())) {
        this.currentMonth.set(d.getMonth());
        this.currentYear.set(d.getFullYear());
      }
    }
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.monthChange.emit({ month: this.currentMonth() + 1, year: this.currentYear() });
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.monthChange.emit({ month: this.currentMonth() + 1, year: this.currentYear() });
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth.set(today.getMonth());
    this.currentYear.set(today.getFullYear());
    const todayStr = this.formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
    this.selectedDate.set(todayStr);
    this.dateSelect.emit(todayStr);
  }

  onSelectDay(day: CalendarDay): void {
    this.selectedDate.set(day.dateStr);
    this.dateSelect.emit(day.dateStr);
  }

  private formatDate(year: number, month: number, day: number): string {
    const mm = month < 10 ? `0${month}` : `${month}`;
    const dd = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${mm}-${dd}`;
  }
}
