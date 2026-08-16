package com.vn9melody.enums;

public enum MfaType {
    NONE,       // Không sử dụng MFA
    TOTP,       // Google Authenticator, Microsoft Authenticator (RFC 6238)
    SMS,        // OTP qua SMS
    EMAIL,      // OTP qua Email
    FIDO2       // WebAuthn / FIDO2 Security Key
}
