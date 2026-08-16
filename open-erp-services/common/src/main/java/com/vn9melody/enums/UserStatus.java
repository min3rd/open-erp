package com.vn9melody.enums;

public enum UserStatus {
    ACTIVE,               // Đang hoạt động bình thường
    INACTIVE,             // Vô hiệu hóa
    LOCKED,               // Bị khóa (ví dụ: đăng nhập sai nhiều lần)
    PENDING_ACTIVATION,   // Chờ kích hoạt qua email/admin
    SUSPENDED             // Tạm đình chỉ
}
