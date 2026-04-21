import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { RecurringBill } from '../types/finance';
import {
  getRecurringBills,
  formatCurrency,
} from '../utils/financeStorage';

// ─── Constants ───────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'a-z', label: 'A to Z' },
  { value: 'z-a', label: 'Z to A' },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest', label: 'Lowest' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const PAGE_SIZE = 10;

// ─── Avatar helpers ───────────────────────────────────────────────────────────

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
  name: string;
}

function Avatar({ name }: AvatarProps): React.ReactElement {
  const initials = name.trim().split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  const bg = avatarColour(initials);
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronDown(): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReceiptIcon(): React.ReactElement {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 3H4C3.44772 3 3 3.44772 3 4V20.5C3 20.7761 3.22386 21 3.5 21C3.59368 21 3.68461 20.9733 3.7634 20.9234L6 19.5L8.2366 20.9234C8.47355 21.0741 8.78443 21.054 9.00165 20.8732L12 18.381L14.9983 20.8732C15.2156 21.054 15.5265 21.0741 15.7634 20.9234L18 19.5L20.2366 20.9234C20.4704 21.0722 20.7765 21.0556 20.9934 20.882C21.0827 20.8105 21.1511 20.716 21.1923 20.6071C21.2335 20.4982 21.2462 20.3783 21.229 20.2592L21.2292 20.2593C21.2292 20.2593 21.2292 20.2593 21.2292 20.2593C21.2292 20.2593 21.2292 20.2593 21 20.5V4C21 3.44772 20.5523 3 20 3ZM17 15H7V13H17V15ZM17 11H7V9H17V11ZM17 7H7V5H17V7Z" fill="currentColor"/>
    </svg>
  );
}

function CheckCircleIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm-1.5-4.5l-3-3 1.41-1.41L7.5 7.67l4.59-4.58L13.5 4.5l-6 6z" fill="currentColor"/>
    </svg>
  );
}

function ExclamationCircleIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zM7 4h2v5H7V4zm0 6h2v2H7v-2z" fill="currentColor"/>
    </svg>
  );
}

// ─── Custom Select ────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (val: string) => void;
  placeholder?: string;
}

function CustomSelect({ id, value, options, onChange, placeholder }: CustomSelectProps): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer hover:bg-beige-100 ${
                  opt.value === value ? 'font-bold text-grey-900' : 'text-grey-600'
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecurringBillsPage(): React.ReactElement {
  const [bills] = useState<RecurringBill[]>(() => getRecurringBills());
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<SortValue>('latest');
  const [page, setPage] = useState<number>(1);

  // Compute stats
  const totalBills = bills.reduce((acc, b) => acc + b.amount, 0);
  
  let paidCount = 0;
  let paidAmount = 0;
  let upcomingCount = 0;
  let upcomingAmount = 0;
  let dueSoonCount = 0;
  let dueSoonAmount = 0;

  bills.forEach((b) => {
    if (b.isPaid) {
      paidCount++;
      paidAmount += b.amount;
    } else {
      upcomingCount++;
      upcomingAmount += b.amount;
      if (b.isUpcoming) {
        dueSoonCount++;
        dueSoonAmount += b.amount;
      }
    }
  });

  // Filter + sort
  const filtered = useMemo<RecurringBill[]>(() => {
    let list = [...bills];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }

    switch (sort) {
      case 'latest':
        list.sort((a, b) => b.dayOfMonth - a.dayOfMonth);
        break;
      case 'oldest':
        list.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
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
  }, [bills, search, sort]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setPage(1); }, [search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  return (
    <div className="mx-auto w-full px-4 md:px-10 xl:px-20 container space-y-8 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-grey-900">Recurring Bills</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Summaries */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
          {/* Total bills card */}
          <div className="rounded-xl bg-grey-900 p-6 flex flex-col gap-8 text-white shadow-sm">
            <ReceiptIcon />
            <div>
              <p className="text-sm text-grey-100 mb-2">Total bills</p>
              <p className="text-3xl font-bold">{formatCurrency(totalBills)}</p>
            </div>
          </div>

          {/* Summary card */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-grey-900 mb-5">Summary</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-grey-100 pb-4">
                <span className="text-sm text-grey-500">Paid bills</span>
                <span className="text-sm font-bold text-grey-900">
                  {paidCount} ({formatCurrency(paidAmount)})
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-grey-100 pb-4">
                <span className="text-sm text-grey-500">Total Upcoming</span>
                <span className="text-sm font-bold text-grey-900">
                  {upcomingCount} ({formatCurrency(upcomingAmount)})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#C94736]">Due Soon</span>
                <span className="text-sm font-bold text-[#C94736]">
                  {dueSoonCount} ({formatCurrency(dueSoonAmount)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bills Table */}
        <div className="flex-1 rounded-xl bg-white p-6 md:p-8 shadow-sm">
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-[320px]">
              <input
                id="bills-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bills"
                className="h-10 w-full rounded-lg border border-beige-500 pl-4 pr-10 text-sm text-grey-900 placeholder:text-grey-300 outline-none focus:border-grey-500 transition-colors focus-visible:ring-2 focus-visible:ring-grey-900/20"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-grey-300">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-grey-500 hidden sm:block">Sort by</span>
                <div className="w-[140px]">
                  <CustomSelect
                    id="sort-select"
                    value={sort}
                    options={SORT_OPTIONS}
                    onChange={(val) => setSort(val as SortValue)}
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
                  <th className="pb-3 text-left text-xs font-normal text-grey-500">Bill Title</th>
                  <th className="pb-3 text-left text-xs font-normal text-grey-500 hidden sm:table-cell">Due Date</th>
                  <th className="pb-3 text-right text-xs font-normal text-grey-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-sm text-grey-900 font-bold">
                      No results.
                    </td>
                  </tr>
                ) : (
                  paginated.map((bill, idx) => (
                    <tr
                      key={bill.id}
                      className={`transition-colors hover:bg-beige-100/50 ${
                        idx < paginated.length - 1 ? 'border-b border-grey-100' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-4">
                          <Avatar name={bill.name} />
                          <span className="font-bold text-grey-900">{bill.name}</span>
                        </div>
                      </td>
                      {/* Date / Status */}
                      <td className="py-4 pr-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${bill.isPaid ? 'text-[#277C78]' : bill.isUpcoming ? 'text-[#C94736]' : 'text-grey-500'}`}>
                            Monthly - {getOrdinal(bill.dayOfMonth)}
                          </span>
                          {bill.isPaid && <span className="text-[#277C78]"><CheckCircleIcon /></span>}
                          {!bill.isPaid && bill.isUpcoming && <span className="text-[#C94736]"><ExclamationCircleIcon /></span>}
                        </div>
                      </td>
                      {/* Amount */}
                      <td className="py-4 text-right">
                        <span className={`font-bold ${bill.isPaid ? 'text-grey-900' : bill.isUpcoming ? 'text-[#C94736]' : 'text-grey-900'}`}>
                          {formatCurrency(bill.amount)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      p === page
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
          )}
        </div>
      </div>
    </div>
  );
}
