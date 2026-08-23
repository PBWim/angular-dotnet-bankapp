export interface Transaction {
  id: number;
  type: 'deposit' | 'withdraw';
  amount: number;
  description: string;
  date: Date;
  balance: number; // The balance field stores the account balance after that transaction
}