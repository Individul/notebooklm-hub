'use client';

import React from 'react';
import { Sparkles, Plus, ExternalLink, Download, Upload, BookOpen, Key, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onAddNew: () => void;
  onOpenCopilot: () => void;
  onOpenImportExport: () => void;
  onOpenAuth: () => void;
  hasApiKey: boolean;
  totalNotebooks: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export function Navbar({ 
  onAddNew, 
  onOpenCopilot, 
  onOpenImportExport, 
  onOpenAuth, 
  hasApiKey, 
  totalNotebooks,
  theme = 'light',
  onToggleTheme
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 text-white shadow-md shadow-blue-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                NotebookLM <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Hub</span>
              </h1>
              <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 sm:inline-block">
                {totalNotebooks} notebook-uri
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Organizează și accesează notebook-urile tale Google Gemini
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct NotebookLM Official Link */}
          <a
            href="https://notebooklm.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 md:flex"
            title="Deschide Google NotebookLM oficial"
          >
            <span>notebooklm.google.com</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* Theme Toggle (Mod Alb / Mod Întunecat) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
              title={theme === 'light' ? 'Comută pe Modul Întunecat' : 'Comută pe Modul Alb (Luminos)'}
            >
              {theme === 'light' ? <Moon className="h-3.5 w-3.5 text-slate-600" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
              <span className="hidden md:inline">{theme === 'light' ? 'Mod Întunecat' : 'Mod Alb'}</span>
            </button>
          )}

          {/* Backup / Export / Import */}
          <button
            onClick={onOpenImportExport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Export / Import date"
          >
            <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Backup & Date</span>
          </button>

          {/* Gemini AI Authentication Status Button */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition ${
              hasApiKey
                ? 'border border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
            }`}
            title={hasApiKey ? 'Autentificat cu Google Gemini API' : 'Autentifică-te cu Google Gemini API'}
          >
            <Key className="h-3.5 w-3.5" />
            <span>{hasApiKey ? 'Gemini Conectat' : 'Autentificare AI'}</span>
          </button>

          {/* Gemini Copilot Button */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:from-purple-700 hover:to-indigo-700 hover:shadow"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gemini Copilot</span>
          </button>

          {/* Add Notebook Button */}
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Adaugă Notebook</span>
          </button>
        </div>

      </div>
    </header>
  );
}
