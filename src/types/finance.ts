export interface Transaction {
  id: string;
  avatar: string;
  name: string;
  category: string;
  date: string; // ISO date string
  amount: number; // positive = income, negative = expense
  recurring?: boolean;
}

export interface Pot {
  id: string;
  name: string;
  target: number;
  total: number;
  theme: string; // hex colour
}

export interface Budget {
  id: string;
  category: string;
  maximum: number;
  theme: string; // hex colour
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number; // always positive
  dayOfMonth: number;
  isPaid: boolean;
  isUpcoming: boolean; // due within 5 days
}

export type DashboardPage =
  | 'overview'
  | 'transactions'
  | 'budgets'
  | 'pots'
  | 'recurring-bills';
