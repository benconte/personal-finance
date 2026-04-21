import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Pot } from '../types/finance';
import {
  getPots,
  savePot,
  updatePot,
  deletePot,
  formatCurrency,
} from '../utils/financeStorage';
import { generateId } from '../utils/storage';

const THEMES = [
  { name: 'Green', hex: '#277C78' },
  { name: 'Yellow', hex: '#F2CDAC' },
  { name: 'Cyan', hex: '#82C9D7' },
  { name: 'Navy', hex: '#626070' },
  { name: 'Red', hex: '#C94736' },
  { name: 'Purple', hex: '#826CB0' },
  { name: 'Turquoise', hex: '#597C7C' },
  { name: 'Brown', hex: '#93674F' },
  { name: 'Magenta', hex: '#934F6F' },
  { name: 'Blue', hex: '#3F82B2' },
  { name: 'Grey', hex: '#97A0AC' },
  { name: 'Army Green', hex: '#7F9161' },
  { name: 'Orange', hex: '#BE6C49' },
] as const;

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

function ThemeSelect({
  value,
  onChange,
  usedThemes,
}: {
  value: string;
  onChange: (val: string) => void;
  usedThemes: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  const selected = THEMES.find((t) => t.hex === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-beige-500 bg-white px-4 text-sm text-grey-900 cursor-pointer hover:border-grey-500 focus-visible:ring-2 focus-visible:ring-grey-900/20"
      >
        {selected ? (
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selected.hex }} />
            <span>{selected.name}</span>
          </div>
        ) : (
          <span className="text-grey-500">Select a theme</span>
        )}
        <svg
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-beige-500 bg-white shadow-lg">
          {THEMES.map((theme) => {
            const isUsed = usedThemes.includes(theme.hex) && theme.hex !== value;
            return (
              <li key={theme.hex}>
                <button
                  type="button"
                  disabled={isUsed}
                  onClick={() => {
                    onChange(theme.hex);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer hover:bg-beige-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: theme.hex }} />
                  <span className={theme.hex === value ? 'font-bold text-grey-900' : 'text-grey-900'}>
                    {theme.name}
                  </span>
                  {isUsed && <span className="ml-auto text-xs text-grey-500">(Already used)</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PotModal({
  isOpen,
  onClose,
  onSubmit,
  editingPot,
  usedThemes,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; target: number; theme: string }) => void;
  editingPot?: Pot | null;
  usedThemes: string[];
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [theme, setTheme] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setName(editingPot?.name || '');
      setTarget(editingPot?.target ? String(editingPot.target) : '');
      setTheme(editingPot?.theme || '');
      setErrors({});
    }
  }, [isOpen, editingPot]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Pot Name is required.';
    if (!target) newErrors.target = 'Target Amount is required.';
    else if (isNaN(Number(target)) || Number(target) <= 0) newErrors.target = 'Enter a valid target amount.';
    if (!theme) newErrors.theme = 'Please select a theme.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      target: Number(target),
      theme,
    });
  }

  const charsLeft = 30 - name.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if ((e.target as Element).id === 'pot-modal-overlay') onClose(); }} id="pot-modal-overlay">
      <div className="w-full max-w-[560px] rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-grey-900">{editingPot ? 'Edit Pot' : 'Add New Pot'}</h2>
          <button onClick={onClose} className="text-grey-500 hover:text-grey-900 transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mb-6 text-sm text-grey-500">
          Choose a category to set a spending budget. These categories can help you monitor spending.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-grey-500">Pot Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: '' }); }}
              maxLength={30}
              placeholder="e.g. Rainy Days"
              className={`h-10 rounded-lg border px-4 text-sm text-grey-900 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-grey-900/20 ${errors.name ? 'border-red-500' : 'border-beige-500 focus:border-grey-900'}`}
            />
            <div className="flex items-center justify-between text-xs">
              {errors.name ? <span className="text-red-500">{errors.name}</span> : <span />}
              <span className="text-grey-500 text-right">{charsLeft} characters left</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-grey-500">Target Amount</label>
            <input
              type="number"
              step="1"
              value={target}
              onChange={(e) => { setTarget(e.target.value); setErrors({ ...errors, target: '' }); }}
              placeholder="$ e.g. 2000"
              className={`h-10 rounded-lg border px-4 text-sm text-grey-900 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-grey-900/20 ${errors.target ? 'border-red-500' : 'border-beige-500 focus:border-grey-900'}`}
            />
            {errors.target && <span className="text-xs text-red-500">{errors.target}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-grey-500">Theme</label>
            <ThemeSelect value={theme} onChange={(v) => { setTheme(v); setErrors({ ...errors, theme: '' }); }} usedThemes={usedThemes} />
            {errors.theme && <span className="text-xs text-red-500">{errors.theme}</span>}
          </div>

          <button type="submit" className="mt-2 h-12 w-full rounded-lg bg-grey-900 text-sm font-bold text-white transition-colors hover:bg-grey-500 cursor-pointer">
            {editingPot ? 'Save Changes' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DeletePotModal({
  isOpen,
  onClose,
  onConfirm,
  potName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  potName: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if ((e.target as Element).id === 'delete-modal-overlay') onClose(); }} id="delete-modal-overlay">
      <div className="w-full max-w-[560px] rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-grey-900">Delete '{potName}'?</h2>
          <button onClick={onClose} className="text-grey-500 hover:text-grey-900 transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mb-6 text-sm text-grey-500">
          Are you sure you want to delete this pot? This action cannot be reversed, and all the data inside it will be removed forever.
        </p>
        <div className="flex flex-col gap-4">
          <button onClick={onConfirm} className="h-12 w-full rounded-lg bg-red-500 text-sm font-bold text-white transition-colors hover:bg-red-500/80 cursor-pointer">
            Yes, Confirm Deletion
          </button>
          <button onClick={onClose} className="h-12 w-full rounded-lg text-sm font-bold text-grey-500 transition-colors hover:text-grey-900 cursor-pointer">
            No, Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

function MoneyModal({
  isOpen,
  onClose,
  onSubmit,
  pot,
  mode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  pot: Pot | null;
  mode: 'add' | 'withdraw';
}) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !pot) return null;

  const isAdd = mode === 'add';
  const val = Number(amount) || 0;

  let newTotal = pot.total;
  if (isAdd) newTotal += val;
  else newTotal -= val;

  const percentage = Math.min(100, Math.max(0, (newTotal / pot.target) * 100));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pot) return;
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (!isAdd && num > pot.total) {
      setError(`Cannot withdraw more than ${formatCurrency(pot.total)}.`);
      return;
    }
    onSubmit(num);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if ((e.target as Element).id === 'money-modal-overlay') onClose(); }} id="money-modal-overlay">
      <div className="w-full max-w-[560px] rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-grey-900">{isAdd ? `Add to '${pot.name}'` : `Withdraw from '${pot.name}'`}</h2>
          <button onClick={onClose} className="text-grey-500 hover:text-grey-900 transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mb-6 text-sm text-grey-500">
          {isAdd
            ? 'Add money to your pot to keep it separate from your main balance. As soon as you add this money, it will be deducted from your current balance.'
            : 'Withdraw money from your pot. As soon as you withdraw this money, it will be added to your current balance.'}
        </p>

        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-grey-500">New Amount</span>
          <span className="text-3xl font-bold text-grey-900">{formatCurrency(newTotal)}</span>
        </div>

        <div className="mb-6">
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-beige-100 relative">
            {isAdd ? (
              <>
                <div className="absolute left-0 top-0 h-full rounded-l-full bg-grey-900" style={{ width: `${Math.min(100, (pot.total / pot.target) * 100)}%` }} />
                <div className="absolute top-0 h-full rounded-r-full transition-all duration-300" style={{ backgroundColor: pot.theme, left: `${(pot.total / pot.target) * 100}%`, width: `${Math.min(100 - (pot.total / pot.target) * 100, (val / pot.target) * 100)}%` }} />
              </>
            ) : (
              <>
                <div className="absolute left-0 top-0 h-full rounded-l-full transition-all duration-300" style={{ backgroundColor: pot.theme, width: `${Math.max(0, percentage)}%` }} />
                <div className="absolute top-0 h-full bg-red-500 transition-all duration-300" style={{ left: `${percentage}%`, width: `${Math.min(100 - percentage, (val / pot.target) * 100)}%` }} />
              </>
            )}
          </div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={isAdd ? 'text-[#277C78]' : 'text-red-500'}>{percentage.toFixed(2)}%</span>
            <span className="text-grey-500">Target of {pot.target}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-grey-500">{isAdd ? 'Amount to Add' : 'Amount to Withdraw'}</label>
            <input
              type="number"
              step="1"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              className={`h-10 rounded-lg border px-4 text-sm text-grey-900 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-grey-900/20 ${error ? 'border-red-500' : 'border-beige-500 focus:border-grey-900'}`}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>

          <button type="submit" className="h-12 w-full rounded-lg bg-grey-900 text-sm font-bold text-white transition-colors hover:bg-grey-500 cursor-pointer">
            {isAdd ? 'Confirm Addition' : 'Confirm Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PotsPage(): React.ReactElement {
  const [pots, setPots] = useState<Pot[]>(() => getPots());

  const [isPotModalOpen, setPotModalOpen] = useState(false);
  const [editingPot, setEditingPot] = useState<Pot | null>(null);

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [potToDelete, setPotToDelete] = useState<Pot | null>(null);

  const [moneyModalState, setMoneyModalState] = useState<{ isOpen: boolean; mode: 'add' | 'withdraw'; pot: Pot | null }>({
    isOpen: false,
    mode: 'add',
    pot: null,
  });

  const usedThemes = useMemo(() => pots.map((p) => p.theme), [pots]);

  function handleAddOrEdit(data: { name: string; target: number; theme: string }) {
    if (editingPot) {
      updatePot(editingPot.id, { ...data });
    } else {
      const newPot: Pot = {
        id: generateId(),
        total: 0,
        ...data,
      };
      savePot(newPot);
    }
    setPots(getPots());
    setPotModalOpen(false);
  }

  function handleDelete() {
    if (potToDelete) {
      deletePot(potToDelete.id);
      setPots(getPots());
    }
    setDeleteModalOpen(false);
    setPotToDelete(null);
  }

  function handleMoney(amount: number) {
    if (moneyModalState.pot) {
      const pot = moneyModalState.pot;
      const newTotal = moneyModalState.mode === 'add' ? pot.total + amount : pot.total - amount;
      updatePot(pot.id, { total: newTotal });
      setPots(getPots());
    }
    setMoneyModalState({ ...moneyModalState, isOpen: false });
  }

  return (
    <div className="mx-auto w-full px-4 md:px-10 xl:px-20 container space-y-8 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-grey-900">Pots</h1>
        <button
          onClick={() => {
            setEditingPot(null);
            setPotModalOpen(true);
          }}
          className="rounded-lg bg-grey-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-grey-500 cursor-pointer"
        >
          + Add New Pot
        </button>
      </header>

      {pots.length === 0 ? (
        <div className="rounded-xl p-8 flex justify-center items-center h-64">
          <p className="text-grey-500 font-medium">You don't have a pot account yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pots.map((pot) => {
            const percentage = Math.min(100, Math.max(0, (pot.total / pot.target) * 100));

            return (
              <div key={pot.id} className="rounded-xl bg-white p-6 shadow-sm flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: pot.theme }} />
                    <h2 className="text-xl font-bold text-grey-900">{pot.name}</h2>
                  </div>
                  <PotCardMenu
                    onEdit={() => {
                      setEditingPot(pot);
                      setPotModalOpen(true);
                    }}
                    onDelete={() => {
                      setPotToDelete(pot);
                      setDeleteModalOpen(true);
                    }}
                  />
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-grey-500">Total Saved</span>
                    <span className="text-3xl font-bold text-grey-900">{formatCurrency(pot.total)}</span>
                  </div>
                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-beige-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: pot.theme }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-grey-500">{percentage.toFixed(2)}%</span>
                    <span className="text-grey-500">Target of {formatCurrency(pot.target)}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setMoneyModalState({ isOpen: true, mode: 'add', pot })}
                    className="flex-1 rounded-lg bg-beige-100 py-4 text-sm font-bold text-grey-900 hover:bg-white hover:border-beige-500 border border-transparent transition-colors cursor-pointer"
                  >
                    + Add Money
                  </button>
                  <button
                    onClick={() => setMoneyModalState({ isOpen: true, mode: 'withdraw', pot })}
                    className="flex-1 rounded-lg bg-beige-100 py-4 text-sm font-bold text-grey-900 hover:bg-white hover:border-beige-500 border border-transparent transition-colors cursor-pointer"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <PotModal
        isOpen={isPotModalOpen}
        onClose={() => setPotModalOpen(false)}
        onSubmit={handleAddOrEdit}
        editingPot={editingPot}
        usedThemes={usedThemes}
      />

      <DeletePotModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        potName={potToDelete?.name || ''}
      />

      <MoneyModal
        isOpen={moneyModalState.isOpen}
        onClose={() => setMoneyModalState({ ...moneyModalState, isOpen: false })}
        onSubmit={handleMoney}
        pot={moneyModalState.pot}
        mode={moneyModalState.mode}
      />
    </div>
  );
}

function PotCardMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center text-grey-300 hover:text-grey-500 cursor-pointer transition-colors"
      >
        <svg width="16" height="4" viewBox="0 0 16 4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="2" cy="2" r="2" fill="currentColor" />
          <circle cx="8" cy="2" r="2" fill="currentColor" />
          <circle cx="14" cy="2" r="2" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-32 rounded-lg bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-beige-100 py-2">
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full px-4 py-2 text-left text-sm font-medium text-grey-900 hover:bg-beige-100 cursor-pointer transition-colors"
          >
            Edit Pot
          </button>
          <div className="my-1 border-t border-beige-100" />
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full px-4 py-2 text-left text-sm font-medium text-red-500 hover:bg-beige-100 cursor-pointer transition-colors"
          >
            Delete Pot
          </button>
        </div>
      )}
    </div>
  );
}
