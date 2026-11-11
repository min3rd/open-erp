package com.vn9melody.openerp.plugins.attendance.engine;

import com.vn9melody.openerp.plugins.attendance.model.LogEventType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;

class CsvLogParserTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Test
    @DisplayName("Parse BioTime standard CSV with commas")
    void parseBioTimeCommaDelimited() {
        String csv = """
                EmployeeCode,DateTime,PunchState,DeviceName
                EMP001,2026-11-02 08:00:00,0,DEVICE_GATE_A
                EMP001,2026-11-02 17:30:00,1,DEVICE_GATE_A
                EMP002,2026-11-02 08:15:00,IN,DEVICE_GATE_B
                EMP002,2026-11-02 17:00:00,OUT,DEVICE_GATE_B
                """;

        CsvLogParser.ParseResult result = CsvLogParser.parse(csv, ZONE);

        assertTrue(result.errors().isEmpty(), "Should have no errors");
        assertEquals(4, result.entries().size());

        CsvLogParser.ParsedLogEntry e1 = result.entries().get(0);
        assertEquals("EMP001", e1.employeeCode());
        assertEquals(LogEventType.IN, e1.eventType());
        assertEquals("DEVICE_GATE_A", e1.deviceCode());

        CsvLogParser.ParsedLogEntry e2 = result.entries().get(1);
        assertEquals("EMP001", e2.employeeCode());
        assertEquals(LogEventType.OUT, e2.eventType());

        CsvLogParser.ParsedLogEntry e3 = result.entries().get(2);
        assertEquals("EMP002", e3.employeeCode());
        assertEquals(LogEventType.IN, e3.eventType());
    }

    @Test
    @DisplayName("Parse ZKTeco CSV with separate Date and Time columns and semicolons")
    void parseZKTecoSemicolonDelimited() {
        String csv = """
                EnrollNumber;Date;Time;State;DeviceCode
                EMP101;02/11/2026;08:05:00;0;DEV01
                EMP101;02/11/2026;17:35:00;1;DEV01
                """;

        CsvLogParser.ParseResult result = CsvLogParser.parse(csv, ZONE);

        assertTrue(result.errors().isEmpty());
        assertEquals(2, result.entries().size());
        assertEquals("EMP101", result.entries().get(0).employeeCode());
        assertEquals(LogEventType.IN, result.entries().get(0).eventType());
        assertEquals(LogEventType.OUT, result.entries().get(1).eventType());
    }

    @Test
    @DisplayName("Handle invalid lines and report errors gracefully")
    void parseInvalidLines() {
        String csv = """
                EmployeeCode,DateTime,PunchState
                EMP001,invalid-date,IN
                ,2026-11-02 08:00:00,IN
                EMP002,2026-11-02 08:30:00,IN
                """;

        CsvLogParser.ParseResult result = CsvLogParser.parse(csv, ZONE);

        assertEquals(1, result.entries().size());
        assertEquals("EMP002", result.entries().get(0).employeeCode());
        assertEquals(2, result.errors().size());
    }

    @Test
    @DisplayName("Vietnamese header names support")
    void parseVietnameseHeaders() {
        String csv = """
                MaNV,ThoiGian,TrangThai,ThietBi
                NV_01,2026-11-02 08:00:00,Vào,MayChamCong_T1
                NV_01,2026-11-02 17:00:00,Ra,MayChamCong_T1
                """;

        CsvLogParser.ParseResult result = CsvLogParser.parse(csv, ZONE);

        assertTrue(result.errors().isEmpty());
        assertEquals(2, result.entries().size());
        assertEquals("NV_01", result.entries().get(0).employeeCode());
        assertEquals(LogEventType.IN, result.entries().get(0).eventType());
        assertEquals(LogEventType.OUT, result.entries().get(1).eventType());
    }
}

