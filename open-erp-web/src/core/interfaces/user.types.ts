export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  roles?: string[];
  permissions?: string[];
  avatarUrl?: string | null;
  status?: string;
  createdAt: string;
  lastLoginAt?: string;
}
