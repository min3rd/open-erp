export interface MeProfile {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  displayName?: string;
  phone?: string;
  avatar?: MeAvatar | null;
  avatarUrl?: string | null;
  status: string;
  verifiedAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  address?: MeAddress;
  dateOfBirth?: string;
  skills?: string[];
  hobbies?: string[];
  roles?: MeRole[];
  permissions?: string[];
}

export interface MeAvatar {
  key: string;
  bucket: string;
  presignedUrl?: string | null;
}

export interface MeAddress {
  country?: string;
  street?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

export interface MeRole {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface MeSettings {
  dateFormat: string;
  timeFormat: string;
  locale: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  layoutDensity: 'compact' | 'comfortable';
  notificationsInApp: boolean;
  notificationsEmail: boolean;
  notificationsPush: boolean;
}

export interface MeSession {
  id: string;
  deviceInfo: string;
  ipAddress?: string | null;
  createdAt?: string;
  expiresAt: string;
}

export interface UpdateMeDto {
  fullName?: string;
  displayName?: string;
  phone?: string;
  avatarKey?: string;
  avatarBucket?: string;
  address?: MeAddress;
  dateOfBirth?: string;
  skills?: string[];
  hobbies?: string[];
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFAStatus {
  enabled: boolean;
  hasRecoveryCodes: boolean;
}

export interface TwoFAPrepareResult {
  secret: string;
  otpauthUrl: string;
  qrData: string;
}

export interface TwoFAEnableResult {
  recoveryCodes: string[];
}
