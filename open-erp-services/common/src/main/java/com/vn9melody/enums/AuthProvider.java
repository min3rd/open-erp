package com.vn9melody.enums;

public enum AuthProvider {
    LOCAL,             // Mật khẩu truyền thống
    GOOGLE,            // OAuth2 / OpenID Connect Google
    MICROSOFT_AZURE,   // Microsoft Entra ID / Azure AD OAuth2/OIDC
    KEYCLOAK,          // Keycloak OpenID Connect
    OKTA,              // Okta OIDC / SAML
    LDAP,              // Giao thức thư mục LDAP
    ACTIVE_DIRECTORY,  // Microsoft Active Directory
    SAML2,             // SAML 2.0 Enterprise SSO
    GITHUB,            // GitHub OAuth2
    APPLE              // Sign in with Apple
}
