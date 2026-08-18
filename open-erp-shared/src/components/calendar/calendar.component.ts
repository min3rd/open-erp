import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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

@Component({
  selector: 'erp-calendar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './calendar.component.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CalendarComponent implements OnInit {
  @Input() selectedDate?: string; // YYYY-MM-DD
  @Input() events: CalendarEvent[] = [];
  @Input() bordered: boolean = true;

  @Output() dateSelect = new EventEmitter<string>();
  @Output() monthChange = new EventEmitter<{ month: number; year: number }>();

  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  weekDays: string[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  daysMatrix: CalendarDay[] = [];

  ngOnInit(): void {
    if (this.selectedDate) {
      const d = new Date(this.selectedDate);
      if (!isNaN(d.getTime())) {
        this.currentMonth = d.getMonth();
        this.currentYear = d.getFullYear();
      }
    }
    this.generateDays();
  }

  get monthLabel(): string {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
      'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
      'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return `${months[this.currentMonth]} ${this.currentYear}`;
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateDays();
    this.monthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateDays();
    this.monthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    const todayStr = this.formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
    this.selectedDate = todayStr;
    this.generateDays();
    this.dateSelect.emit(todayStr);
  }

  onSelectDay(day: CalendarDay): void {
    this.selectedDate = day.dateStr;
    this.generateDays();
    this.dateSelect.emit(day.dateStr);
  }

  private generateDays(): void {
    const matrix: CalendarDay[] = [];
    const today = new Date();
    const todayStr = this.formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

    const firstDayIndex = (new Date(this.currentYear, this.currentMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = this.currentMonth === 0 ? 12 : this.currentMonth;
      const y = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      const dateStr = this.formatDate(y, m, d);
      matrix.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate,
        events: this.events.filter(e => e.date === dateStr)
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this.formatDate(this.currentYear, this.currentMonth + 1, d);
      matrix.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate,
        events: this.events.filter(e => e.date === dateStr)
      });
    }

    // Next month filler days (to fill 35 or 42 grid cells)
    const remaining = (7 - (matrix.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = this.currentMonth === 11 ? 1 : this.currentMonth + 2;
      const y = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      const dateStr = this.formatDate(y, m, d);
      matrix.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate,
        events: this.events.filter(e => e.date === dateStr)
      });
    }

    this.daysMatrix = matrix;
  }

  private formatDate(year: number, month: number, day: number): string {
    const mm = month < 10 ? `0${month}` : `${month}`;
    const dd = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${mm}-${dd}`;
  }
}
