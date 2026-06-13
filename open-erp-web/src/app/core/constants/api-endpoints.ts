export const API_ENDPOINTS = {
  auth: {
    register: '/api/v1/auth/register',
    checkSubdomain: (subdomain: string) => `/api/v1/auth/check-subdomain?subdomain=${subdomain}`,
  },
};
