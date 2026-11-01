package com.vn9melody.openerp.plugins.employee.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/** HR profile row; persistence is owned by the Core plugin data gateway. */
public class EmployeeProfile {

    public UUID id;
    public String employeeCode;
    public UUID userId;
    public String status;
    public String employeeType;
    public String fullName;
    public String photoUrl;
    public LocalDate dateOfBirth;
    public String gender;
    public String nationality;
    public String maritalStatus;
    public String nationalId;
    public String taxCode;
    public String socialInsuranceNo;
    public String healthInsuranceNo;
    public String personalEmail;
    public String workEmail;
    public String phone;
    public String currentAddress;
    public String permanentAddress;
    public String emergencyContactName;
    public String emergencyContactRelationship;
    public String emergencyContactPhone;
    public String educationLevel;
    public String school;
    public String major;
    public Integer graduationYear;
    public String notes;
    public String scopeSyncStatus;
    public Instant createdAt;
    public Instant updatedAt;
    public Instant archivedAt;
    public LocalDate exitDate;
    public String exitReason;
    public Long version;

    public static EmployeeProfile from(Map<String, Object> row) {
        EmployeeProfile item = new EmployeeProfile();
        item.id = Rows.uuid(row.get("id"));
        item.employeeCode = Rows.text(row.get("employee_code"));
        item.userId = Rows.uuid(row.get("user_id"));
        item.status = Rows.text(row.get("status"));
        item.employeeType = Rows.text(row.get("employee_type"));
        item.fullName = Rows.text(row.get("full_name"));
        item.photoUrl = Rows.text(row.get("photo_url"));
        item.dateOfBirth = Rows.date(row.get("date_of_birth"));
        item.gender = Rows.text(row.get("gender"));
        item.nationality = Rows.text(row.get("nationality"));
        item.maritalStatus = Rows.text(row.get("marital_status"));
        item.nationalId = Rows.text(row.get("national_id"));
        item.taxCode = Rows.text(row.get("tax_code"));
        item.socialInsuranceNo = Rows.text(row.get("social_insurance_no"));
        item.healthInsuranceNo = Rows.text(row.get("health_insurance_no"));
        item.personalEmail = Rows.text(row.get("personal_email"));
        item.workEmail = Rows.text(row.get("work_email"));
        item.phone = Rows.text(row.get("phone"));
        item.currentAddress = Rows.text(row.get("current_address"));
        item.permanentAddress = Rows.text(row.get("permanent_address"));
        item.emergencyContactName = Rows.text(row.get("emergency_contact_name"));
        item.emergencyContactRelationship = Rows.text(row.get("emergency_contact_relationship"));
        item.emergencyContactPhone = Rows.text(row.get("emergency_contact_phone"));
        item.educationLevel = Rows.text(row.get("education_level"));
        item.school = Rows.text(row.get("school"));
        item.major = Rows.text(row.get("major"));
        item.graduationYear = Rows.integer(row.get("graduation_year"));
        item.notes = Rows.text(row.get("notes"));
        item.scopeSyncStatus = Rows.text(row.get("scope_sync_status"));
        item.createdAt = Rows.instant(row.get("created_at"));
        item.updatedAt = Rows.instant(row.get("updated_at"));
        item.archivedAt = Rows.instant(row.get("archived_at"));
        item.exitDate = Rows.date(row.get("exit_date"));
        item.exitReason = Rows.text(row.get("exit_reason"));
        item.version = Rows.longValue(row.get("version"));
        return item;
    }
}
