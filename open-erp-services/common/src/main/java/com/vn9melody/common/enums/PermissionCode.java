package com.vn9melody.common.enums;

public enum PermissionCode {
    // ==========================================
    // SYSTEM & USER MANAGEMENT
    // ==========================================
    USER_VIEW(ModuleCode.SYSTEM, "Xem danh sách và thông tin người dùng"),
    USER_CREATE(ModuleCode.SYSTEM, "Tạo mới người dùng"),
    USER_UPDATE(ModuleCode.SYSTEM, "Cập nhật thông tin người dùng"),
    USER_DELETE(ModuleCode.SYSTEM, "Xóa hoặc vô hiệu hóa tài khoản người dùng"),
    USER_RESET_PASSWORD(ModuleCode.SYSTEM, "Đặt lại mật khẩu người dùng"),

    ROLE_VIEW(ModuleCode.SYSTEM, "Xem danh sách vai trò và quyền hạn"),
    ROLE_MANAGE(ModuleCode.SYSTEM, "Thêm, sửa, xóa vai trò và gán quyền"),
    ROLE_ASSIGN(ModuleCode.SYSTEM, "Gán vai trò cho người dùng"),

    // ==========================================
    // PLUGIN MANAGEMENT & ORCHESTRATION
    // ==========================================
    PLUGIN_VIEW(ModuleCode.PLUGIN, "Xem danh sách và chi tiết các plugin"),
    PLUGIN_UPLOAD(ModuleCode.PLUGIN, "Tải lên gói plugin mới (.zip, image)"),
    PLUGIN_DEPLOY(ModuleCode.PLUGIN, "Triển khai/Khởi chạy container pod cho plugin"),
    PLUGIN_UNDEPLOY(ModuleCode.PLUGIN, "Dừng và gỡ bỏ deployment của plugin"),
    PLUGIN_UPGRADE(ModuleCode.PLUGIN, "Nâng cấp phiên bản plugin"),
    PLUGIN_DELETE(ModuleCode.PLUGIN, "Xóa hoàn toàn plugin và artifact khỏi hệ thống"),
    PLUGIN_CONFIG(ModuleCode.PLUGIN, "Cấu hình biến môi trường và thiết lập plugin"),
    PLUGIN_TENANT_ASSIGN(ModuleCode.PLUGIN, "Bật/Tắt và phân phối plugin cho từng Tenant");

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