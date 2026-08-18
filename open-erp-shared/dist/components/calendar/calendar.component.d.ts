import { EventEmitter, OnInit } from '@angular/core';
export interface CalendarEvent {
    date: string;
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
export declare class CalendarComponent implements OnInit {
    selectedDate?: string;
    events: CalendarEvent[];
    bordered: boolean;
    dateSelect: EventEmitter<string>;
    monthChange: EventEmitter<{
        month: number;
        year: number;
    }>;
    currentMonth: number;
    currentYear: number;
    weekDays: string[];
    daysMatrix: CalendarDay[];
    ngOnInit(): void;
    get monthLabel(): string;
    prevMonth(): void;
    nextMonth(): void;
    goToToday(): void;
    onSelectDay(day: CalendarDay): void;
    private generateDays;
    private formatDate;
}
