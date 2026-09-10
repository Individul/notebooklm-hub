'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Star, 
  Headphones, 
  BookOpen, 
  Sparkles, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { Notebook, DEFAULT_CATEGORIES } from '@/lib/types';
import { 
  getStoredNotebooks, 
  saveStoredNotebooks, 
  INITIAL_NOTEBOOKS 
} from '@/lib/storage';
import { Navbar } from '@/components/Navbar';
import { StatsBanner } from '@/components/StatsBanner';
import { NotebookCard } from '@/components/NotebookCard';
import { NotebookModal } from '@/components/NotebookModal';
import { GeminiCopilotDrawer } from '@/components/GeminiCopilotDrawer';
import { ImportExportModal } from '@/components/ImportExportModal';
import { NotebookWorkspace } from '@/components/NotebookWorkspace';
import { ApiKeyModal } from '@/components/ApiKeyModal';

export default function Home() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeWorkspaceNotebook, setActiveWorkspaceNotebook] = useState<Notebook | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toate');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyAudio, setOnlyAudio] = useState(false);

  // Modals & Panels
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load from storage on mount
  useEffect(() => {
    const data = getStoredNotebooks();
    setNotebooks(data);
    setHasApiKey(Boolean(localStorage.getItem('gemini_user_api_key')));
    
    // Default to light (Varianta Albă)
    const savedTheme = (localStorage.getItem('notebooklm_theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    if (typeof document !== 'undefined') {
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    setIsLoaded(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('notebooklm_theme', next);
    } catch {}
    if (typeof document !== 'undefined') {
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Save to storage whenever notebooks change
  const updateNotebooks = (newNotebooks: Notebook[]) => {
    setNotebooks(newNotebooks);
    saveStoredNotebooks(newNotebooks);
  };

  const handleSaveNotebook = (notebookToSave: Notebook) => {
    if (editingNotebook) {
      // Update existing
      const updated = notebooks.map(nb => nb.id === notebookToSave.id ? notebookToSave : nb);
      updateNotebooks(updated);
    } else {
      // Create new
      updateNotebooks([notebookToSave, ...notebooks]);
    }
    setEditingNotebook(null);
  };

  const handleDeleteNotebook = (id: string) => {
    if (confirm('Sigur doriți să ștergeți acest notebook din lista locală?')) {
      const filtered = notebooks.filter(nb => nb.id !== id);
      updateNotebooks(filtered);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const updated = notebooks.map(nb => {
      if (nb.id === id) {
        return { ...nb, isFavorite: !nb.isFavorite };
      }
      return nb;
    });
    updateNotebooks(updated);
  };

  const handleUpdateNotebookNotes = (notebookId: string, additionalNotes: string) => {
    const updated = notebooks.map(nb => {
      if (nb.id === notebookId) {
        return { ...nb, notes: (nb.notes || '') + additionalNotes, updatedAt: new Date().toISOString() };
      }
      return nb;
    });
    updateNotebooks(updated);
  };

  // Filtered notebooks
  const filteredNotebooks = notebooks.filter(nb => {
    // Search query matching title, description, tags, or sources
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = nb.title.toLowerCase().includes(q);
      const matchDesc = nb.description?.toLowerCase().includes(q);
      const matchTags = nb.tags?.some(t => t.toLowerCase().includes(q));
      const matchSources = nb.sources?.some(s => s.title.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags && !matchSources) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== 'Toate' && nb.category !== selectedCategory) {
      return false;
    }

    // Favorites filter
    if (onlyFavorites && !nb.isFavorite) {
      return false;
    }

    // Audio Overview filter
    if (onlyAudio && nb.audioOverviewStatus !== 'generated') {
      return false;
    }

    return true;
  });

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-xs text-slate-500">Se încarcă notebook-urile...</p>
        </div>
      </div>
    );
  }

  if (activeWorkspaceNotebook) {
    return (
      <NotebookWorkspace
        notebook={activeWorkspaceNotebook}
        onBack={() => setActiveWorkspaceNotebook(null)}
        onUpdateNotebook={(updated) => {
          setActiveWorkspaceNotebook(updated);
          const newNotebooks = notebooks.map(nb => nb.id === updated.id ? updated : nb);
          updateNotebooks(newNotebooks);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        hasApiKey={hasApiKey}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Navbar */}
      <Navbar
        onAddNew={() => {
          setEditingNotebook(null);
          setIsModalOpen(true);
        }}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        hasApiKey={hasApiKey}
        totalNotebooks={notebooks.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Hero / Intro Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 sm:p-8 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Google NotebookLM Companion</span>
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Toate Notebook-urile tale Gemini, organizate într-un singur loc
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed">
              Păstrează legătura cu sursele tale, podcasturile audio generate și întreabă asistentul Gemini oricând ai nevoie de idei de cercetare sau sinteze.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setEditingNotebook(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                <Plus className="h-4 w-4 text-blue-600" />
                <span>Adaugă primul notebook</span>
              </button>
              <a
                href="https://notebooklm.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/25"
              >
                <span>Deschide Google NotebookLM</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Decorative background gradients */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-purple-500/30 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 -bottom-10 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
        </div>

        {/* Stats Metrics */}
        <StatsBanner notebooks={notebooks} />

        {/* Search, Filter & Categories Section */}
        <div className="space-y-4">
          
          {/* Search bar & Quick Toggles */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Caută după titlu, tag, sursă sau descriere..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs shadow-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Toggle Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  onlyFavorites
                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>Doar Favorite</span>
              </button>

              <button
                onClick={() => setOnlyAudio(!onlyAudio)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  onlyAudio
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                <Headphones className="h-3.5 w-3.5 text-emerald-500" />
                <span>Audio Podcast Gata</span>
              </button>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {DEFAULT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = cat === 'Toate' 
                ? notebooks.length 
                : notebooks.filter(n => n.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? 'bg-blue-500/40 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Notebooks Grid or Empty State */}
        {filteredNotebooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotebooks.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onEdit={(item) => {
                  setEditingNotebook(item);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteNotebook}
                onToggleFavorite={handleToggleFavorite}
                onOpenWorkspace={(item) => setActiveWorkspaceNotebook(item)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Layers className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Niciun notebook găsit
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Nu am găsit niciun notebook conform filtrelor sau termenului de căutare introdus.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Toate');
                  setOnlyFavorites(false);
                  setOnlyAudio(false);
                }}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Resetează filtrele
              </button>
              <button
                onClick={() => {
                  setEditingNotebook(null);
                  setIsModalOpen(true);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow"
              >
                + Adaugă Notebook Nou
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Add / Edit Notebook Modal */}
      <NotebookModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNotebook(null);
        }}
        onSave={handleSaveNotebook}
        initialNotebook={editingNotebook}
      />

      {/* Gemini Copilot Drawer */}
      <GeminiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        notebooks={notebooks}
        onUpdateNotebookNotes={handleUpdateNotebookNotes}
      />

      {/* Backup & Import/Export Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        notebooks={notebooks}
        onImport={(importedList) => updateNotebooks(importedList)}
      />

      {/* Google Gemini Authentication Modal */}
      <ApiKeyModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onKeySaved={(key) => setHasApiKey(Boolean(key))}
      />

    </div>
  );
}
