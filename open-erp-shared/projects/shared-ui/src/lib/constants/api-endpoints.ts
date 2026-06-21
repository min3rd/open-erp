export const API_ENDPOINTS = {
  auth: {
    register: '/api/v1/auth/register',
    registerUser: '/api/v1/auth/register/user',
    checkSubdomain: '/api/v1/auth/check-subdomain',
    login: '/api/v1/auth/login',
    selectTenant: '/api/v1/auth/select-tenant',
    testLinkTenant: '/api/v1/auth/test-link-tenant',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
    activate: '/api/v1/auth/activate',
    me: '/api/v1/auth/me',
    menu: '/api/v1/auth/menu',
    oauthGoogle: '/api/v1/auth/oauth/google',
    oauthMicrosoft: '/api/v1/auth/oauth/microsoft',
  },
};
