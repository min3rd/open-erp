package com.vn9melody.common.enums;

public enum PermissionCode {
    // SALES MODULE
    ORDER_VIEW(ModuleCode.SALES, "Xem danh sách và chi tiết đơn hàng"),
    ORDER_CREATE(ModuleCode.SALES, "Tạo mới đơn hàng"),
    ORDER_UPDATE(ModuleCode.SALES, "Cập nhật đơn hàng"),
    ORDER_DELETE(ModuleCode.SALES, "Xóa đơn hàng"),

    // CRM MODULE
    CUSTOMER_VIEW(ModuleCode.CRM, "Xem danh sách khách hàng"),
    CUSTOMER_MANAGE(ModuleCode.CRM, "Thêm/sửa/xóa khách hàng"),

    // SYSTEM MODULE
    USER_MANAGE(ModuleCode.SYSTEM, "Quản trị người dùng"),
    ROLE_ASSIGN(ModuleCode.SYSTEM, "Gán vai trò và phân quyền");

    private final ModuleCode module;
    private final String description;

    PermissionCode(ModuleCode module, String description) {
        this.module = module;
        this.description = description;
    }

    public ModuleCode getModule() {
        return module;
    }

    public String getDescription() {
        return description;
    }
}