import { OnInit } from '@angular/core';
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
    readonly selectedDate: import("@angular/core").ModelSignal<string | undefined>;
    readonly events: import("@angular/core").InputSignal<CalendarEvent[]>;
    readonly bordered: import("@angular/core").InputSignal<boolean>;
    readonly dateSelect: import("@angular/core").OutputEmitterRef<string>;
    readonly monthChange: import("@angular/core").OutputEmitterRef<{
        month: number;
        year: number;
    }>;
    currentMonth: import("@angular/core").WritableSignal<number>;
    currentYear: import("@angular/core").WritableSignal<number>;
    weekDays: string[];
    readonly monthLabel: import("@angular/core").Signal<string>;
    readonly daysMatrix: import("@angular/core").Signal<CalendarDay[]>;
    ngOnInit(): void;
    prevMonth(): void;
    nextMonth(): void;
    goToToday(): void;
    onSelectDay(day: CalendarDay): void;
    private formatDate;
}
