export interface UserItem {
  id: number;
  username: string;
  fullName: string;
  email: string;
  department: string;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string;
}
