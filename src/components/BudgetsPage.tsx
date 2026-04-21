import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Budget, Transaction } from '../types/finance';
import {
  getBudgets,
  saveBudget,
  updateBudget,
  deleteBudget,
  getTransactions,
  formatCurrency,
  formatDate,
} from '../utils/financeStorage';
import { NavLink } from 'react-router';

const CATEGORIES = [
  'Entertainment', 'Bills', 'Groceries', 'Dining Out', 'Transportation',
  'Personal Care', 'Education', 'Lifestyle', 'Shopping', 'General'
];

const THEMES = [
  { name: 'Green', color: '#277C78' },
  { name: 'Grey', color: '#626070' },
  { name: 'Cyan', color: '#82C9D7' },
  { name: 'Orange', color: '#E26E16' },
  { name: 'Purple', color: '#826CB0' },
  { name: 'Red', color: '#C94736' },
  { name: 'Yellow', color: '#F2CDAC' },
  { name: 'Navy', color: '#3F82B2' },
  { name: 'Turquoise', color: '#597C7C' },
  { name: 'Brown', color: '#93674F' },
  { name: 'Magenta', color: '#934F6F' },
];

function useOnClickOutside(ref: React.RefObject<any>, handler: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent | TouchEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    }
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

function Dropdown({ options, value, onChange, placeholder, renderOption, renderSelected }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setIsOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-beige-500 rounded-[8px] h-10 px-5 py-3 text-sm text-grey-900 bg-white cursor-pointer focus-visible:ring-2 focus-visible:ring-grey-900/20"
      >
        {value ? renderSelected(value) : <span className="text-grey-500">{placeholder}</span>}
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <path d="M1 1.5L6 6.5L11 1.5" stroke="#696868" strokeWidth="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[8px] shadow-lg border border-beige-100 max-h-60 overflow-y-auto z-50">
          {options.map((opt: any, i: number) => (
            <div
              key={i}
              className="px-5 py-3 hover:bg-beige-100 cursor-pointer text-sm text-grey-900 border-b border-beige-100 last:border-0"
              onClick={() => { onChange(opt); setIsOpen(false); }}
            >
              {renderOption(opt)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getSpentForBudget(category: string, transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.category === category)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
}

export default function BudgetsPage(): React.ReactElement {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const addEditModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(addEditModalRef, () => setIsModalOpen(false));
  useOnClickOutside(deleteModalRef, () => setIsDeleteModalOpen(false));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setBudgets(getBudgets());
    setTransactions(getTransactions());
  };

  const isCategoryUsed = (cat: string) => budgets.some(b => b.category === cat && b.id !== budgetToEdit?.id);
  const isThemeUsed = (themeHex: string) => budgets.some(b => b.theme === themeHex && b.id !== budgetToEdit?.id);

  const openAddModal = () => {
    setModalMode('add');
    setBudgetToEdit(null);
    setSelectedCategory('');
    setMaxSpend('');
    setSelectedTheme('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setModalMode('edit');
    setBudgetToEdit(b);
    setSelectedCategory(b.category);
    setMaxSpend(b.maximum.toString());
    setSelectedTheme(b.theme);
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !maxSpend || !selectedTheme) return;

    if (modalMode === 'add') {
      const newBudget: Budget = {
        id: `b${Date.now()}`,
        category: selectedCategory,
        maximum: parseFloat(maxSpend),
        theme: selectedTheme
      };
      saveBudget(newBudget);
    } else if (budgetToEdit) {
      updateBudget(budgetToEdit.id, {
        category: selectedCategory,
        maximum: parseFloat(maxSpend),
        theme: selectedTheme
      });
    }

    loadData();
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (budgetToDelete) {
      deleteBudget(budgetToDelete.id);
      loadData();
      setIsDeleteModalOpen(false);
    }
  };

  const chartData = budgets.map(b => ({
    name: b.category,
    value: b.maximum,
    color: b.theme,
    maximum: b.maximum
  }));

  const totalSpent = budgets.reduce((acc, b) => acc + getSpentForBudget(b.category, transactions), 0);
  const totalLimit = budgets.reduce((acc, b) => acc + b.maximum, 0);

  return (
    <div className="mx-auto w-full px-4 md:px-10 xl:px-20 container space-y-8 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-grey-900">Budgets</h1>
        <button onClick={openAddModal} className="bg-grey-900 text-white hover:bg-grey-500 px-4 py-3 rounded-[8px] font-bold text-sm cursor-pointer">
          +Add New Budget
        </button>
      </header>

      {budgets.length === 0 ? (
        <p className="text-sm text-grey-500">You haven't created a budget yet.</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-[420px] bg-white rounded-xl p-8 flex flex-col items-center gap-8 shadow-sm">
            <div className="relative w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-3xl font-bold text-grey-900">{formatCurrency(totalSpent)}</span>
                <span className="text-xs text-grey-500 mt-1">of {formatCurrency(totalLimit)} limit</span>
              </div>
            </div>

            <div className="w-full">
              <h2 className="text-lg font-bold text-grey-900 mb-6">Spending Summary</h2>
              <div className="flex flex-col gap-4">
                {budgets.map(b => (
                  <div key={b.id} className="flex items-center justify-between border-b border-grey-100/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: b.theme }} />
                      <span className="text-sm text-grey-500">{b.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-grey-900">{formatCurrency(getSpentForBudget(b.category, transactions))}</span>
                      <span className="text-xs text-grey-500">of {formatCurrency(b.maximum)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col gap-6">
            {budgets.map(budget => {
              const spent = getSpentForBudget(budget.category, transactions);
              const free = budget.maximum - spent;
              const progress = Math.min(100, (spent / budget.maximum) * 100);
              const txs = transactions.filter(t => t.category === budget.category).slice(0, 3);
              const isMenuOpen = openDropdownId === budget.id;

              return (
                <div key={budget.id} className="bg-white rounded-xl p-8 flex flex-col gap-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: budget.theme }} />
                      <h2 className="text-xl font-bold text-grey-900">{budget.category}</h2>
                    </div>
                    <div className="relative">
                      <button onClick={() => setOpenDropdownId(isMenuOpen ? null : budget.id)} className="text-grey-300 hover:text-grey-900 cursor-pointer p-2">
                        <svg width="16" height="4" viewBox="0 0 16 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="2" cy="2" r="2" fill="currentColor" />
                          <circle cx="8" cy="2" r="2" fill="currentColor" />
                          <circle cx="14" cy="2" r="2" fill="currentColor" />
                        </svg>
                      </button>
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                          <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-beige-100 py-2 z-20">
                            <button onClick={() => openEditModal(budget)} className="w-full text-left px-4 py-2 text-sm text-grey-900 hover:bg-beige-100 cursor-pointer border-b border-beige-100">Edit Budget</button>
                            <button onClick={() => { setBudgetToDelete(budget); setIsDeleteModalOpen(true); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-beige-100 cursor-pointer">Delete Budget</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-grey-500">Maximum of {formatCurrency(budget.maximum)}</p>

                  <div className="h-8 bg-beige-100 rounded-[4px] overflow-hidden p-1">
                    <div className="h-full rounded-sm transition-all duration-500" style={{ backgroundColor: budget.theme, width: `${progress}%` }} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-col gap-1 w-1/2 border-l-4 pl-4" style={{ borderColor: budget.theme }}>
                      <span className="text-xs text-grey-500">Spent</span>
                      <span className="text-sm font-bold text-grey-900">{formatCurrency(spent)}</span>
                    </div>
                    <div className="flex flex-col gap-1 w-1/2 border-l-4 pl-4 border-beige-100">
                      <span className="text-xs text-grey-500">Free</span>
                      <span className={`text-sm font-bold ${free < 0 ? 'text-red-500' : 'text-grey-900'}`}>
                        {formatCurrency(free)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-beige-100 rounded-xl p-5 mt-2">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-grey-900">Latest Spending</h3>
                      <NavLink to="/transactions" end>
                        <button className="text-sm text-grey-500 flex items-center gap-2 hover:text-grey-900 cursor-pointer">
                          See All
                          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </button>
                      </NavLink>
                    </div>

                    {txs.length === 0 ? (
                      <p className="text-sm text-grey-500 text-center py-2">You haven't made any spendings yet.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {txs.map(tx => (
                          <div key={tx.id} className="flex items-center justify-between border-b border-grey-100/50 pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-grey-900">{tx.avatar}</div>
                              <span className="text-sm font-bold text-grey-900">{tx.name}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-sm font-bold text-grey-900">{formatCurrency(Math.abs(tx.amount))}</span>
                              <span className="text-xs text-grey-500">{formatDate(tx.date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div ref={addEditModalRef} className="w-full max-w-[560px] rounded-[12px] bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-grey-900">
                {modalMode === 'add' ? 'Add New Budget' : 'Edit Budget'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-grey-500 hover:text-grey-900 cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.2071 1.79289C14.5976 2.18342 14.5976 2.81658 14.2071 3.20711L9.41421 8L14.2071 12.7929C14.5976 13.1834 14.5976 13.8166 14.2071 14.2071C13.8166 14.5976 13.1834 14.5976 12.7929 14.2071L8 9.41421L3.20711 14.2071C2.81658 14.5976 2.18342 14.5976 1.79289 14.2071C1.40237 13.8166 1.40237 13.1834 1.79289 12.7929L6.58579 8L1.79289 3.20711C1.40237 2.81658 1.40237 2.18342 1.79289 1.79289C2.18342 1.40237 2.81658 1.40237 3.20711 1.79289L8 6.58579L12.7929 1.79289C13.1834 1.40237 13.8166 1.40237 14.2071 1.79289Z" fill="currentColor" />
                </svg>
              </button>
            </div>

            <p className="mb-6 text-sm text-grey-500">
              Choose a category to set a spending budget. These categories can help you monitor spending.
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-grey-500">Category</label>
                <Dropdown
                  options={CATEGORIES}
                  value={selectedCategory}
                  onChange={(c: string) => { if (!isCategoryUsed(c)) setSelectedCategory(c) }}
                  placeholder="Select a category"
                  renderSelected={(c: string) => <span>{c}</span>}
                  renderOption={(c: string) => {
                    const used = isCategoryUsed(c);
                    return (
                      <div className={`flex items-center justify-between ${used ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span>{c}</span>
                        {used && <span className="text-xs text-grey-500">(Already used)</span>}
                      </div>
                    );
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-grey-500">Maximum Spend</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-grey-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full border border-beige-500 rounded-[8px] h-10 pl-9 pr-5 py-3 text-sm text-grey-900 focus-visible:ring-2 focus-visible:ring-grey-900/20 bg-white"
                    placeholder="e.g. 2000"
                    value={maxSpend}
                    onChange={e => setMaxSpend(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-grey-500">Theme</label>
                <Dropdown
                  options={THEMES}
                  value={THEMES.find(t => t.color === selectedTheme)}
                  onChange={(t: any) => { if (!isThemeUsed(t.color)) setSelectedTheme(t.color) }}
                  placeholder="Select a theme"
                  renderSelected={(t: any) => (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                      <span>{t.name}</span>
                    </div>
                  )}
                  renderOption={(t: any) => {
                    const used = isThemeUsed(t.color);
                    return (
                      <div className={`flex items-center justify-between ${used ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                          <span>{t.name}</span>
                        </div>
                        {used && <span className="text-xs text-grey-500">(Already used)</span>}
                      </div>
                    );
                  }}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-[8px] bg-grey-900 p-4 font-bold text-white hover:bg-grey-500 cursor-pointer"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div ref={deleteModalRef} className="w-full max-w-[560px] rounded-[12px] bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-grey-900">Delete '{budgetToDelete.category}'?</h2>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-grey-500 hover:text-grey-900 cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.2071 1.79289C14.5976 2.18342 14.5976 2.81658 14.2071 3.20711L9.41421 8L14.2071 12.7929C14.5976 13.1834 14.5976 13.8166 14.2071 14.2071C13.8166 14.5976 13.1834 14.5976 12.7929 14.2071L8 9.41421L3.20711 14.2071C2.81658 14.5976 2.18342 14.5976 1.79289 14.2071C1.40237 13.8166 1.40237 13.1834 1.79289 12.7929L6.58579 8L1.79289 3.20711C1.40237 2.81658 1.40237 2.18342 1.79289 1.79289C2.18342 1.40237 2.81658 1.40237 3.20711 1.79289L8 6.58579L12.7929 1.79289C13.1834 1.40237 13.8166 1.40237 14.2071 1.79289Z" fill="currentColor" />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-sm text-grey-500">
              Are you sure you want to delete this budget? This action cannot be reversed, and all the data inside it will be removed forever.
            </p>
            <div className="flex justify-between items-center gap-4">
              <button
                onClick={handleConfirmDelete}
                className="w-full rounded-[8px] bg-rose-700 p-4 font-bold text-white hover:bg-rose-600 cursor-pointer"
              >
                Yes, Confirm Delete
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full rounded-[8px] bg-transparent p-4 font-bold text-grey-900 hover:bg-beige-100 cursor-pointer"
              >
                No, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
