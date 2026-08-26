var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, model, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
const MONTH_NAMES = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];
let CalendarComponent = class CalendarComponent {
    selectedDate = model(undefined);
    events = input([]);
    bordered = input(true);
    dateSelect = output();
    monthChange = output();
    currentMonth = signal(new Date().getMonth());
    currentYear = signal(new Date().getFullYear());
    weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    monthLabel = computed(() => {
        return `${MONTH_NAMES[this.currentMonth()]} ${this.currentYear()}`;
    });
    daysMatrix = computed(() => {
        const m = this.currentMonth();
        const y = this.currentYear();
        const sel = this.selectedDate();
        const evts = this.events();
        const matrix = [];
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
    ngOnInit() {
        const sel = this.selectedDate();
        if (sel) {
            const d = new Date(sel);
            if (!isNaN(d.getTime())) {
                this.currentMonth.set(d.getMonth());
                this.currentYear.set(d.getFullYear());
            }
        }
    }
    prevMonth() {
        if (this.currentMonth() === 0) {
            this.currentMonth.set(11);
            this.currentYear.update(y => y - 1);
        }
        else {
            this.currentMonth.update(m => m - 1);
        }
        this.monthChange.emit({ month: this.currentMonth() + 1, year: this.currentYear() });
    }
    nextMonth() {
        if (this.currentMonth() === 11) {
            this.currentMonth.set(0);
            this.currentYear.update(y => y + 1);
        }
        else {
            this.currentMonth.update(m => m + 1);
        }
        this.monthChange.emit({ month: this.currentMonth() + 1, year: this.currentYear() });
    }
    goToToday() {
        const today = new Date();
        this.currentMonth.set(today.getMonth());
        this.currentYear.set(today.getFullYear());
        const todayStr = this.formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
        this.selectedDate.set(todayStr);
        this.dateSelect.emit(todayStr);
    }
    onSelectDay(day) {
        this.selectedDate.set(day.dateStr);
        this.dateSelect.emit(day.dateStr);
    }
    formatDate(year, month, day) {
        const mm = month < 10 ? `0${month}` : `${month}`;
        const dd = day < 10 ? `0${day}` : `${day}`;
        return `${year}-${mm}-${dd}`;
    }
};
CalendarComponent = __decorate([
    Component({
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
], CalendarComponent);
export { CalendarComponent };
//# sourceMappingURL=calendar.component.js.map