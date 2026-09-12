'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Download, 
  BookOpen, 
  Key, 
  Sun, 
  Moon,
  Settings,
  X
} from 'lucide-react';
import { ExpenseBadge } from '@/components/ExpenseBadge';

interface NavbarProps {
  onAddNew?: () => void;
  onOpenCopilot: () => void;
  onOpenImportExport: () => void;
  onOpenAuth: () => void;
  hasApiKey: boolean;
  totalNotebooks: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function Navbar({ 
  onOpenCopilot, 
  onOpenImportExport, 
  onOpenAuth, 
  hasApiKey, 
  totalNotebooks,
  theme = 'light',
  onToggleTheme
}: NavbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              NotebookLM <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Hub</span>
            </h1>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {totalNotebooks} {totalNotebooks === 1 ? 'caiet' : 'caiete'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Gemini AI Auth Status Pill */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer border ${
              hasApiKey
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-800/80 dark:bg-purple-950/50 dark:text-purple-300'
            }`}
            title={hasApiKey ? 'Cheie Gemini API conectată' : 'Conectează cheia Gemini API'}
          >
            <Key className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{hasApiKey ? 'Gemini Activ' : 'Conectează API'}</span>
          </button>

          {/* Expense Tracker Pill */}
          <ExpenseBadge />

          {/* Gemini Copilot Button */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:from-purple-700 hover:to-indigo-700 cursor-pointer"
            title="Deschide asistentul Copilot global"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Gemini Copilot</span>
          </button>

          {/* Settings & Options Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Setări, Temă & Backup"
            >
              <Settings className="h-4 w-4" />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 text-xs space-y-2.5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold">Opțiuni Hub</span>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Theme Toggle */}
                {onToggleTheme && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Temă:</span>
                    <button
                      onClick={onToggleTheme}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      {theme === 'light' ? <Moon className="h-3.5 w-3.5 text-slate-600" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
                      <span>{theme === 'light' ? 'Mod Întunecat' : 'Mod Luminos'}</span>
                    </button>
                  </div>
                )}

                {/* Backup & Data */}
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    onOpenImportExport();
                  }}
                  className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Backup & Date (Export / Import)</span>
                  </span>
                </button>

                {/* Google NotebookLM Official */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href="https://notebooklm.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsSettingsOpen(false)}
                    className="w-full flex items-center justify-between rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 font-semibold transition"
                  >
                    <span>notebooklm.google.com</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
