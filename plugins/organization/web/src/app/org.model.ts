export interface Branch {
  id: string;
  code: string;
  name: string;
  phone?: string;
  address?: string;
  is_default?: boolean;
  status?: string;
}

export interface Department {
  id: string;
  branch_id: string;
  parent_id?: string;
  code: string;
  name: string;
  manager_user_id?: string;
  status?: string;
}

export interface Membership {
  id: string;
  user_id: string;
  branch_id: string;
  department_id: string;
  direct_manager_user_id?: string;
  is_primary?: boolean;
  status?: string;
}
