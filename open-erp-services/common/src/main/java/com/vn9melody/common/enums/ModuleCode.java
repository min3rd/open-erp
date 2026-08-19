package com.vn9melody.common.enums;

public enum ModuleCode {
    SYSTEM("Hệ thống"),
    PLUGIN("Quản lý Plugin");

    private final String description;

    ModuleCode(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}