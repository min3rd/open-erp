package com.vn9melody.openerp.plugins.attendance.model;

public enum TimesheetStep {
    S1_LOGS,
    S2_SCHEDULE,
    S3_CALCULATE,
    S4_ADJUST,
    DONE;

    public int order() {
        return switch (this) {
            case S1_LOGS -> 1;
            case S2_SCHEDULE -> 2;
            case S3_CALCULATE -> 3;
            case S4_ADJUST -> 4;
            case DONE -> 5;
        };
    }
}

