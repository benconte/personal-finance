import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Transaction } from '../types/finance';
import {
  getTransactions,
  saveTransaction,
  formatCurrency,
  formatDate,
} from '../utils/financeStorage';
import { generateId } from '../utils/storage';

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

const CATEGORIES = [
  'Entertainment',
  'Bills',
  'Groceries',
  'Dining Out',
  'Transportation',
  'Personal Care',
  'Education',
  'Lifestyle',
  'Shopping',
  'General',
] as const;

type Category = (typeof CATEGORIES)[number];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'a-z', label: 'A to Z' },
  { value: 'z-a', label: 'Z to A' },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest', label: 'Lowest' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const PAGE_SIZE = 8;
const NAME_MAX = 30;

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

interface AvatarProps {
  initials: string;
}

function Avatar({ initials }: AvatarProps): React.ReactElement {
  const bg = avatarColour(initials);
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: bg }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ChevronDown(): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id: string;
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
  placeholder?: string;
}

function CustomSelect({ id, value, options, onChange, placeholder }: CustomSelectProps): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, () => setOpen(false));

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative" id={id}>
      <button
        type="button"
        id={`${id}-trigger`}
        onClick={() => setOpen((p) => !p)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-beige-500 bg-white px-4 text-sm text-grey-900 cursor-pointer hover:border-grey-500 transition-colors"
      >
        <span className={selected ? 'text-grey-900' : 'text-grey-600'}>
          {selected ? selected.label : (placeholder ?? 'Select')}
        </span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <ChevronDown />
        </span>
      </button>

      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-beige-500 bg-white shadow-lg">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                id={`${id}-option-${opt.value}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer hover:bg-beige-100 ${opt.value === value ? 'font-bold text-grey-900' : 'text-grey-600'
                  }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ModalFormData {
  name: string;
  date: string;
  category: string;
  amount: string;
  recurring: boolean;
}

interface ModalErrors {
  name?: string;
  date?: string;
  category?: string;
  amount?: string;
}

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
}

function validateModal(data: ModalFormData): ModalErrors {
  const errors: ModalErrors = {};
  if (!data.name.trim()) errors.name = 'Name is required.';
  else if (data.name.trim().length > NAME_MAX) errors.name = `Max ${NAME_MAX} characters.`;
  if (!data.date) errors.date = 'Date is required.';
  if (!data.category) errors.category = 'Please select a category.';
  const parsed = parseFloat(data.amount);
  if (!data.amount) errors.amount = 'Amount is required.';
  else if (isNaN(parsed) || parsed === 0) errors.amount = 'Enter a valid non-zero amount.';
  return errors;
}

function AddTransactionModal({ onClose, onAdd }: AddTransactionModalProps): React.ReactElement {
  const [form, setForm] = useState<ModalFormData>({
    name: '', date: '', category: '', amount: '', recurring: false,
  });
  const [errors, setErrors] = useState<ModalErrors>({});
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, onClose);

  function handleChange<K extends keyof ModalFormData>(key: K, val: ModalFormData[K]): void {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const errs = validateModal(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const parsed = parseFloat(form.amount);
    const initials = form.name.trim().split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

    const tx: Transaction = {
      id: generateId(),
      avatar: initials,
      name: form.name.trim(),
      category: form.category,
      date: form.date,
      amount: parsed,
      recurring: form.recurring,
    };

    onAdd(tx);
    onClose();
  }

  const charsLeft = NAME_MAX - form.name.length;

  const categoryOptions: SelectOption[] = CATEGORIES.map((c) => ({ value: c, label: c }));

  return (
    <div
      id="modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div ref={ref} className="w-full max-w-[560px] rounded-xl bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-grey-900">Add New Transaction</h2>
          <button
            id="modal-close-btn"
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-grey-500 hover:bg-beige-100 hover:text-grey-900 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form id="add-transaction-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="modal-name" className="text-sm font-medium text-grey-900">
              Transaction Name
            </label>
            <input
              id="modal-name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g Urban Services Hub"
              maxLength={NAME_MAX}
              className={`h-10 w-full rounded-lg border px-4 text-sm text-grey-900 placeholder:text-grey-500 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-grey-900/20 ${errors.name ? 'border-red-500' : 'border-beige-500 focus:border-grey-500'
                }`}
            />
            <div className="flex items-center justify-between">
              {errors.name
                ? <p className="text-xs text-red-500">{errors.name}</p>
                : <span />
              }
              <p className="text-xs text-grey-500 ml-auto">{charsLeft} characters left</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="modal-date" className="text-sm font-medium text-grey-900">
              Transaction Date
            </label>
            <input
              id="modal-date"
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`h-10 w-full rounded-lg border px-4 text-sm text-grey-900 bg-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-grey-900/20 cursor-pointer ${errors.date ? 'border-red-500' : 'border-beige-500 focus:border-grey-500'
                }`}
            />
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-grey-900">Category</label>
            <CustomSelect
              id="modal-category"
              value={form.category}
              options={categoryOptions}
              onChange={(val) => handleChange('category', val as Category)}
              placeholder="Select a category"
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="modal-amount" className="text-sm font-medium text-grey-900">
              Amount
            </label>
            <input
              id="modal-amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="e.g $1000"
              className={`h-10 w-full rounded-lg border px-4 text-sm text-grey-900 placeholder:text-grey-500 bg-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-grey-900/20 ${errors.amount ? 'border-red-500' : 'border-beige-500 focus:border-grey-500'
                }`}
            />
            <p className="text-xs text-grey-500">Positive = income, negative = expense (e.g. -50)</p>
            {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="modal-recurring"
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => handleChange('recurring', e.target.checked)}
              className="h-4 w-4 rounded border-beige-500 accent-grey-900 cursor-pointer"
            />
            <label htmlFor="modal-recurring" className="text-sm font-medium text-grey-900 cursor-pointer">
              Recurring
            </label>
          </div>

          {/* Submit */}
          <button
            id="modal-submit-btn"
            type="submit"
            className="mt-2 h-14 w-full rounded-lg bg-grey-900 text-sm font-bold text-white transition-colors hover:bg-grey-500 cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TransactionsPage(): React.ReactElement {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getTransactions());
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<SortValue>('latest');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Reload from storage whenever a new tx is added
  function handleAdd(tx: Transaction): void {
    saveTransaction(tx);
    setTransactions(getTransactions());
    setPage(1);
  }

  // Filter + sort
  const filtered = useMemo<Transaction[]>(() => {
    let list = [...transactions];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }

    if (filterCategory !== 'all') {
      list = list.filter((t) => t.category === filterCategory);
    }

    switch (sort) {
      case 'latest':
        list.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case 'oldest':
        list.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case 'a-z':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'z-a':
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'highest':
        list.sort((a, b) => b.amount - a.amount);
        break;
      case 'lowest':
        list.sort((a, b) => a.amount - b.amount);
        break;
    }

    return list;
  }, [transactions, search, sort, filterCategory]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setPage(1); }, [search, sort, filterCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const categoryFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All Transactions' },
    ...CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  const sortOptions: SelectOption[] = SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  return (
    <>
      <div className="mx-auto w-full px-4 md:px-10 xl:px-20 container space-y-8 pb-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-grey-900">Transactions</h1>
          <button
            id="add-transaction-btn"
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-grey-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-grey-500 cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add New Transaction
          </button>
        </header>

        <div className="rounded-xl bg-white p-6 md:p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[240px]">
              <input
                id="transactions-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transaction"
                className="h-10 w-full rounded-lg border border-beige-500 pl-4 pr-10 text-sm text-grey-900 placeholder:text-grey-300 outline-none focus:border-grey-500 transition-colors focus-visible:ring-2 focus-visible:ring-grey-900/20"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-grey-300">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-grey-500 hidden sm:block">Sort by</span>
                <div className="w-[140px]">
                  <CustomSelect
                    id="sort-select"
                    value={sort}
                    options={sortOptions}
                    onChange={(val) => setSort(val as SortValue)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-grey-500 hidden sm:block">Filter by Category</span>
                <div className="w-[160px]">
                  <CustomSelect
                    id="category-filter-select"
                    value={filterCategory}
                    options={categoryFilterOptions}
                    onChange={(val) => setFilterCategory(val)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-grey-100">
                  <th className="pb-3 text-left text-xs font-normal text-grey-500">Recipient / Sender</th>
                  <th className="pb-3 text-left text-xs font-normal text-grey-500 hidden md:table-cell">Category</th>
                  <th className="pb-3 text-left text-xs font-normal text-grey-500 hidden sm:table-cell">Transaction Date</th>
                  <th className="pb-3 text-right text-xs font-normal text-grey-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-grey-300">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((tx, idx) => (
                    <tr
                      key={tx.id}
                      className={`transition-colors hover:bg-beige-100/50 ${idx < paginated.length - 1 ? 'border-b border-grey-100' : ''}`}
                    >
                      {/* Name */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-4">
                          <Avatar initials={tx.avatar || tx.name} />
                          <span className="font-bold text-grey-900">{tx.name}</span>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="py-4 pr-4 text-grey-500 hidden md:table-cell">{tx.category}</td>
                      {/* Date */}
                      <td className="py-4 pr-4 text-grey-500 hidden sm:table-cell">{formatDate(tx.date)}</td>
                      {/* Amount */}
                      <td className={`py-4 text-right font-bold ${tx.amount >= 0 ? 'text-[#277C78]' : 'text-grey-900'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <button
              id="pagination-prev-btn"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 rounded-lg border border-beige-500 px-4 py-2 text-sm font-medium text-grey-900 transition-colors hover:bg-beige-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Prev
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  id={`pagination-page-${p}-btn`}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${p === page
                    ? 'bg-grey-900 text-white'
                    : 'border border-beige-500 text-grey-900 hover:bg-beige-100'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              id="pagination-next-btn"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 rounded-lg border border-beige-500 px-4 py-2 text-sm font-medium text-grey-900 transition-colors hover:bg-beige-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              Next
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </>
  );
}
