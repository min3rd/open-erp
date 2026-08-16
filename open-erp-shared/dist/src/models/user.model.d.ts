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
export interface OrderItem {
    id: string;
    customer: string;
    product: string;
    amount: number;
    status: 'COMPLETED' | 'PENDING' | 'PROCESSING';
    date: string;
}
