import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { NavLink } from 'react-router';
import {
  getBalance,
  getTotalIncome,
  getTotalExpenses,
  getPots,
  getTransactions,
  getBudgets,
  getRecurringBills,
  formatCurrency,
  formatDate,
  getSpentForBudget
} from '../utils/financeStorage';
import type { Pot, Transaction, Budget, RecurringBill } from '../types/finance';

interface OverviewPageProps {
  onLogout: () => void;
}

const AVATAR_COLOURS = [
  '#277C78', '#82C9D7', '#F2CDAC', '#626070',
  '#52837B', '#93674F', '#934F6F', '#3F82B2',
  '#97A0AC', '#7F9161',
];

function avatarColour(initials: string): string {
  let n = 0;
  for (let i = 0; i < initials.length; i++) n += initials.charCodeAt(i);
  return AVATAR_COLOURS[n % AVATAR_COLOURS.length];
}

export default function OverviewPage({ onLogout }: OverviewPageProps): React.ReactElement {
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [pots, setPots] = useState<Pot[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [bills, setBills] = useState<RecurringBill[]>([]);

  useEffect(() => {
    setBalance(getBalance());
    setIncome(getTotalIncome());
    setExpenses(getTotalExpenses());
    setPots(getPots());
    setTransactions(getTransactions());
    setBudgets(getBudgets());
    setBills(getRecurringBills());
  }, []);

  const totalSaved = pots.reduce((acc, p) => acc + p.total, 0);

  const chartData = budgets.map(b => ({
    name: b.category,
    value: b.maximum,
    color: b.theme
  }));

  const totalLimit = budgets.reduce((acc, b) => acc + b.maximum, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + getSpentForBudget(b.category, transactions), 0);

  const paidBillsTotal = bills.filter(b => b.isPaid).reduce((acc, b) => acc + b.amount, 0);
  const totalUpcoming = bills.filter(b => !b.isPaid).reduce((acc, b) => acc + b.amount, 0);
  const dueSoonTotal = bills.filter(b => !b.isPaid && b.isUpcoming).reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="mx-auto w-full px-4 md:px-10 xl:px-20 container space-y-8 pb-10">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-grey-900">Overview</h1>
        <button
          onClick={onLogout}
          className="group flex items-center gap-2 rounded-[8px] bg-grey-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-grey-500 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:-translate-x-1">
            <path d="M10.5 8L7.5 5V7H2.5V9H7.5V11L10.5 8Z" fill="currentColor" />
            <path d="M12.5 2.5H6.5V4H12.5V12H6.5V13.5H12.5C13.3284 13.5 14 12.8284 14 12V4C14 3.17157 13.3284 2.5 12.5 2.5Z" fill="currentColor" />
          </svg>
          Logout
        </button>
      </header>

      {/* Top Stats */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl bg-grey-900 p-6 text-white shadow-sm">
          <p className="text-sm font-normal text-white">Current Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-normal text-grey-500">Income</p>
          <p className="text-3xl font-bold text-grey-900">{formatCurrency(income)}</p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-normal text-grey-500">Expenses</p>
          <p className="text-3xl font-bold text-grey-900">{formatCurrency(expenses)}</p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="grid gap-6 xl:grid-cols-12 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-6 col-span-12 xl:col-span-7">
          {/* Pots */}
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-grey-900">Pots</h2>
              <NavLink to="/pots" className="flex items-center gap-2 text-sm text-grey-500 hover:text-grey-900 cursor-pointer">
                See Details
                <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5.5L1 10" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </NavLink>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-1 items-center gap-4 rounded-xl bg-beige-100 p-4 sm:p-6">
                <div className="flex text-[#277C78]">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.1667 24.1667H17.5V22.5H19.1667V24.1667ZM24.1667 15.8333H14.1667V13.3333C14.1667 11.9525 15.2858 10.8333 16.6667 10.8333H21.6667C23.0475 10.8333 24.1667 11.9525 24.1667 13.3333V15.8333ZM25.8333 16.6667H12.5C11.1192 16.6667 10 17.7858 10 19.1667V30.8333C10 32.2142 11.1192 33.3333 12.5 33.3333H25.8333C27.2142 33.3333 28.3333 32.2142 28.3333 30.8333V19.1667C28.3333 17.7858 27.2142 16.6667 25.8333 16.6667Z" fill="currentColor" />
                    <path d="M18.3333 27.5V20.8333M20.8333 20.8333H15.8333M20.8333 27.5H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-normal text-grey-500">Total Saved</p>
                  <p className="text-3xl font-bold text-grey-900">{formatCurrency(totalSaved)}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center gap-4">
                {pots.slice(0, 4).map(pot => (
                  <div key={pot.id} className="flex items-center justify-between">
                    <div className="flex flex-col gap-1 border-l-4 pl-4" style={{ borderColor: pot.theme }}>
                      <p className="text-sm text-grey-500">{pot.name}</p>
                      <p className="text-base font-bold text-grey-900">{formatCurrency(pot.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold text-grey-900">Transactions</h2>
              <NavLink to="/transactions" className="flex items-center gap-2 text-sm text-grey-500 hover:text-grey-900 cursor-pointer">
                See Details
                <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5.5L1 10" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </NavLink>
            </div>

            <div className="flex flex-col">
              {transactions.length === 0 ? (
                <p className="text-sm text-grey-500 text-center py-4">No transactions found.</p>
              ) : (
                transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-grey-100 py-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: avatarColour(tx.avatar || tx.name) }}>
                        {(tx.avatar || tx.name).slice(0, 2).toUpperCase()}
                      </div>
                      <p className="font-bold text-grey-900">{tx.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.amount >= 0 ? 'text-[#277C78]' : 'text-grey-900'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-grey-500 mt-1">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 col-span-12 xl:col-span-5">
          {/* Budgets */}
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-grey-900">Budgets</h2>
              <NavLink to="/budgets" className="flex items-center gap-2 text-sm text-grey-500 hover:text-grey-900 cursor-pointer">
                See Details
                <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5.5L1 10" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </NavLink>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Chart */}
              <div className="relative h-[240px] w-[240px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.length > 0 ? chartData : [{ name: 'Empty', value: 1, color: '#F8F4F0' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                      paddingAngle={0}
                    >
                      {chartData.length > 0 ? chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      )) : <Cell fill="#F8F4F0" />}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                  <p className="text-3xl font-bold text-grey-900">{formatCurrency(totalSpent)}</p>
                  <p className="text-xs text-grey-500 mt-2">of {formatCurrency(totalLimit)} limit</p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex w-full flex-col gap-4 sm:ml-4">
                {budgets.slice(0, 4).map(b => (
                  <div key={b.id} className="flex items-center justify-between w-full">
                    <div className="flex flex-col gap-1 border-l-4 pl-4" style={{ borderColor: b.theme }}>
                      <p className="text-sm text-grey-500">{b.category}</p>
                      <p className="font-bold text-grey-900">{formatCurrency(b.maximum)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recurring Bills */}
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold text-grey-900">Recurring Bills</h2>
              <NavLink to="/bills" className="flex items-center gap-2 text-sm text-grey-500 hover:text-grey-900 cursor-pointer">
                See Details
                <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5.5L1 10" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </NavLink>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-beige-100 p-5 border-l-4 border-[#277C78]">
                <p className="text-sm text-grey-500">Paid Bills</p>
                <p className="font-bold text-grey-900">{formatCurrency(paidBillsTotal)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-beige-100 p-5 border-l-4 border-[#F2CDAC]">
                <p className="text-sm text-grey-500">Total Upcoming</p>
                <p className="font-bold text-grey-900">{formatCurrency(totalUpcoming)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-beige-100 p-5 border-l-4 border-[#82C9D7]">
                <p className="text-sm text-grey-500">Due Soon</p>
                <p className="font-bold text-grey-900">{formatCurrency(dueSoonTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
