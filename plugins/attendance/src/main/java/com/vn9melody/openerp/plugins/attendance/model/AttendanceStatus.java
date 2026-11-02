package com.vn9melody.openerp.plugins.attendance.model;

/** Daily attendance status per CONF-S09-001 Q6 and DES-DB-S09-001 §3.2. */
public enum AttendanceStatus {
    PRESENT,
    ABSENT,
    HALF_DAY,
    WFH,
    ON_LEAVE,
    BUSINESS_TRIP
}
