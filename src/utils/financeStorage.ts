import type { Transaction, Pot, Budget, RecurringBill } from '../types/finance';
import { generateId } from './storage';

const KEYS = {
  transactions: 'finance_transactions',
  pots: 'finance_pots',
  budgets: 'finance_budgets',
  bills: 'finance_bills',
} as const;

function readKey<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeKey<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}


export function seedFinanceData(): void {
  if (localStorage.getItem(KEYS.transactions)) return;

  const transactions: Transaction[] = [
    { id: 't1', avatar: 'UT', name: 'Urban Tech', category: 'Income', date: '2026-05-12', amount: 2500 },
    { id: 't2', avatar: 'GL', name: 'Green Lane Groceries', category: 'Groceries', date: '2026-05-11', amount: -120.5 },
    { id: 't3', avatar: 'ND', name: 'Netflix Digital', category: 'Entertainment', date: '2026-05-10', amount: -15.99 },
    { id: 't4', avatar: 'SP', name: 'Spark Power Co.', category: 'Bills', date: '2026-05-09', amount: -89.0 },
    { id: 't5', avatar: 'JD', name: 'James Doe', category: 'Personal', date: '2026-05-08', amount: 200 },
    { id: 't6', avatar: 'AM', name: 'Amazon Marketplace', category: 'Shopping', date: '2026-05-07', amount: -67.3 },
    { id: 't7', avatar: 'SB', name: 'Starbucks', category: 'Dining Out', date: '2026-05-06', amount: -12.5 },
    { id: 't8', avatar: 'UH', name: 'Urban Health Club', category: 'Recreation', date: '2026-05-05', amount: -45 },
  ];

  const pots: Pot[] = [
    { id: 'p1', name: 'Savings', target: 2000, total: 850, theme: '#277C78' },
    { id: 'p2', name: 'Concert Ticket', target: 150, total: 110, theme: '#626070' },
    { id: 'p3', name: 'Rainy Day', target: 1000, total: 1000, theme: '#82C9D7' },
    { id: 'p4', name: 'New Laptop', target: 1200, total: 390, theme: '#F2CDAC' },
  ];

  const budgets: Budget[] = [
    { id: 'b1', category: 'Groceries', maximum: 300, theme: '#277C78' },
    { id: 'b2', category: 'Dining Out', maximum: 75, theme: '#82C9D7' },
    { id: 'b3', category: 'Entertainment', maximum: 50, theme: '#626070' },
    { id: 'b4', category: 'Personal', maximum: 100, theme: '#F2CDAC' },
  ];

  const bills: RecurringBill[] = [
    { id: 'r1', name: 'Spark Power Co.', amount: 89, dayOfMonth: 9, isPaid: true, isUpcoming: false },
    { id: 'r2', name: 'Netflix Digital', amount: 15.99, dayOfMonth: 10, isPaid: true, isUpcoming: false },
    { id: 'r3', name: 'Internet Provider', amount: 59.99, dayOfMonth: 18, isPaid: false, isUpcoming: true },
    { id: 'r4', name: 'Gym Membership', amount: 45, dayOfMonth: 22, isPaid: false, isUpcoming: false },
    { id: 'r5', name: 'Spotify Premium', amount: 9.99, dayOfMonth: 25, isPaid: false, isUpcoming: false },
  ];

  writeKey(KEYS.transactions, transactions);
  writeKey(KEYS.pots, pots);
  writeKey(KEYS.budgets, budgets);
  writeKey(KEYS.bills, bills);
}

export function getTransactions(): Transaction[] {
  return readKey<Transaction>(KEYS.transactions);
}

export function saveTransaction(tx: Transaction): void {
  const all = getTransactions();
  if (tx.recurring) {
    const bill = getRecurringBills().find(b => b.name === tx.name);
    if (bill) {
      bill.amount = tx.amount;
      bill.dayOfMonth = new Date(tx.date).getDate();
      writeKey(KEYS.bills, getRecurringBills().map(b => b.id === bill?.id ? bill : b));
    } else {
      const newBill: RecurringBill = {
        id: generateId(),
        name: tx.name,
        amount: tx.amount,
        dayOfMonth: new Date(tx.date).getDate(),
        isPaid: true,
        isUpcoming: false,
      };
      writeKey(KEYS.bills, [...getRecurringBills(), newBill]);
    }
  }
  const updated = [...all, tx];
  writeKey(KEYS.transactions, updated);
}

export function getPots(): Pot[] {
  return readKey<Pot>(KEYS.pots);
}

export function savePot(pot: Pot): void {
  const all = getPots();
  writeKey(KEYS.pots, [...all, pot]);
}

export function updatePot(id: string, updates: Partial<Pot>): void {
  const all = getPots();
  const updated = all.map(p => p.id === id ? { ...p, ...updates } : p);
  writeKey(KEYS.pots, updated);
}

export function deletePot(id: string): void {
  const all = getPots();
  writeKey(KEYS.pots, all.filter(p => p.id !== id));
}

export function getBudgets(): Budget[] {
  return readKey<Budget>(KEYS.budgets);
}

export function saveBudget(budget: Budget): void {
  const all = getBudgets();
  writeKey(KEYS.budgets, [...all, budget]);
}

export function updateBudget(id: string, updates: Partial<Budget>): void {
  const all = getBudgets();
  const updated = all.map(b => b.id === id ? { ...b, ...updates } : b);
  writeKey(KEYS.budgets, updated);
}

export function deleteBudget(id: string): void {
  const all = getBudgets();
  writeKey(KEYS.budgets, all.filter(b => b.id !== id));
}

export function getRecurringBills(): RecurringBill[] {
  return readKey<RecurringBill>(KEYS.bills);
}

export function getBalance(): number {
  return getTransactions().reduce((acc, t) => acc + t.amount, 0);
}

export function getTotalIncome(): number {
  return getTransactions()
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);
}

export function getTotalExpenses(): number {
  return getTransactions()
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
}

/** Returns spent amount for a budget category from transactions */
export function getSpentForBudget(category: string, transactions?: Transaction[]): number {
  const txs = transactions || getTransactions();
  return txs
    .filter((t) => t.category === category)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
