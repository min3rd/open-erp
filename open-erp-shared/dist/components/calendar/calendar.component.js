var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
let CalendarComponent = class CalendarComponent {
    selectedDate; // YYYY-MM-DD
    events = [];
    bordered = true;
    dateSelect = new EventEmitter();
    monthChange = new EventEmitter();
    currentMonth = new Date().getMonth();
    currentYear = new Date().getFullYear();
    weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    daysMatrix = [];
    ngOnInit() {
        if (this.selectedDate) {
            const d = new Date(this.selectedDate);
            if (!isNaN(d.getTime())) {
                this.currentMonth = d.getMonth();
                this.currentYear = d.getFullYear();
            }
        }
        this.generateDays();
    }
    get monthLabel() {
        const months = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
            'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
            'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        return `${months[this.currentMonth]} ${this.currentYear}`;
    }
    prevMonth() {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        else {
            this.currentMonth--;
        }
        this.generateDays();
        this.monthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
    }
    nextMonth() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        else {
            this.currentMonth++;
        }
        this.generateDays();
        this.monthChange.emit({ month: this.currentMonth + 1, year: this.currentYear });
    }
    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        const todayStr = this.formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
        this.selectedDate = todayStr;
        this.generateDays();
        this.dateSelect.emit(todayStr);
    }
    onSelectDay(day) {
        this.selectedDate = day.dateStr;
        this.generateDays();
        this.dateSelect.emit(day.dateStr);
    }
    generateDays() {
        const matrix = [];
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
    formatDate(year, month, day) {
        const mm = month < 10 ? `0${month}` : `${month}`;
        const dd = day < 10 ? `0${day}` : `${day}`;
        return `${year}-${mm}-${dd}`;
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], CalendarComponent.prototype, "selectedDate", void 0);
__decorate([
    Input(),
    __metadata("design:type", Array)
], CalendarComponent.prototype, "events", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], CalendarComponent.prototype, "bordered", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], CalendarComponent.prototype, "dateSelect", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], CalendarComponent.prototype, "monthChange", void 0);
CalendarComponent = __decorate([
    Component({
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
], CalendarComponent);
export { CalendarComponent };
//# sourceMappingURL=calendar.component.js.map