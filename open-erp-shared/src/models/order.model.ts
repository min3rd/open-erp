export interface OrderItem {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'CANCELLED';
  date: string;
}
