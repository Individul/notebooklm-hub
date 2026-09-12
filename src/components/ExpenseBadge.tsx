'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Coins, X, RotateCcw } from 'lucide-react';
import { 
  ExpenseStats, 
  INITIAL_EXPENSES, 
  getStoredExpenses, 
  resetExpenses 
} from '@/lib/expenseTracker';

interface ExpenseBadgeProps {
  expenses?: ExpenseStats;
  onUpdateExpenses?: (expenses: ExpenseStats) => void;
  className?: string;
  isCompact?: boolean;
}

export function ExpenseBadge({ 
  expenses: propExpenses, 
  onUpdateExpenses,
  className = '',
  isCompact = false 
}: ExpenseBadgeProps) {
  const [internalExpenses, setInternalExpenses] = useState<ExpenseStats>(INITIAL_EXPENSES);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const expenses = propExpenses || internalExpenses;

  useEffect(() => {
    const refresh = () => {
      const current = getStoredExpenses();
      setInternalExpenses(current);
    };

    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleReset = () => {
    if (confirm('Sigur doriți să resetați contorul de cheltuieli la $0.00?')) {
      const reset = resetExpenses();
      setInternalExpenses(reset);
      if (onUpdateExpenses) {
        onUpdateExpenses(reset);
      }
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-mono transition cursor-pointer shadow-2xs select-none"
        title="Consum tokeni și costuri estimate Gemini API"
      >
        <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          ${expenses.totalCostUSD.toFixed(3)}
        </span>
        <span className={`${isCompact ? 'hidden sm:inline' : ''} text-[11px] font-mono text-slate-500 dark:text-slate-400`}>
          (~{expenses.totalCostMDL.toFixed(3)} MDL)
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 animate-in fade-in duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
            <span className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Coins className="w-4 h-4 text-amber-500" />
              Cheltuieli API Gemini
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400">Cost Total USD:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ${expenses.totalCostUSD.toFixed(5)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400">Echivalent în MDL:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
                ~{expenses.totalCostMDL.toFixed(3)} MDL
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Tokeni Total:</span>
              <span className="font-mono font-semibold">{expenses.totalTokens.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pl-2">
              <span>• Prompt (intrare):</span>
              <span className="font-mono">{expenses.promptTokens.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pl-2">
              <span>• Output (răspuns):</span>
              <span className="font-mono">{expenses.candidateTokens.toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">{expenses.queriesCount} {expenses.queriesCount === 1 ? 'interogare' : 'interogări'}</span>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                title="Resetează istoricul de costuri"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resetează</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
