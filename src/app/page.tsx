'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Star, 
  Headphones, 
  BookOpen, 
  Sparkles, 
  ExternalLink,
  Layers,
  FileText
} from 'lucide-react';
import { Notebook, DEFAULT_CATEGORIES } from '@/lib/types';
import { 
  getStoredNotebooks, 
  saveStoredNotebooks 
} from '@/lib/storage';
import { Navbar } from '@/components/Navbar';
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

  const updateNotebooks = (newNotebooks: Notebook[]) => {
    setNotebooks(newNotebooks);
    saveStoredNotebooks(newNotebooks);
  };

  const handleSaveNotebook = (notebookToSave: Notebook) => {
    if (editingNotebook) {
      const updated = notebooks.map(nb => nb.id === notebookToSave.id ? notebookToSave : nb);
      updateNotebooks(updated);
    } else {
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

    if (selectedCategory !== 'Toate' && nb.category !== selectedCategory) {
      return false;
    }

    if (onlyFavorites && !nb.isFavorite) {
      return false;
    }

    if (onlyAudio && nb.audioOverviewStatus !== 'generated') {
      return false;
    }

    return true;
  });

  // Calculate metrics
  const totalSources = notebooks.reduce((acc, nb) => acc + (nb.sources?.length || 0), 0);
  const totalAudio = notebooks.filter(nb => nb.audioOverviewStatus === 'generated').length;
  const totalFavorites = notebooks.filter(nb => nb.isFavorite).length;

  // Active categories with at least 1 notebook
  const activeCategories = DEFAULT_CATEGORIES.filter(cat => {
    if (cat === 'Toate') return true;
    return notebooks.some(n => n.category === cat);
  });

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent"></div>
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
    <div className="min-h-screen bg-slate-50/70 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
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

      {/* Main Dashboard Container */}
      <main className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1">
        
        {/* Clean Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Caietele Tale
              </h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {notebooks.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {totalSources} {totalSources === 1 ? 'sursă conectată' : 'surse conectate'} • {totalAudio} {totalAudio === 1 ? 'sinteză podcast' : 'sinteze podcast'} • {totalFavorites} favorite
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setEditingNotebook(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Caiet Nou</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Caută în caiete, legi, surse sau descrieri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs shadow-2xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            
            {/* Favorite Filter */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                onlyFavorites
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <Star className={`h-3 w-3 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Favorite ({totalFavorites})</span>
            </button>

            {/* Audio Filter */}
            <button
              onClick={() => setOnlyAudio(!onlyAudio)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                onlyAudio
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <Headphones className="h-3 w-3 text-emerald-500" />
              <span>Audio Gata ({totalAudio})</span>
            </button>

            {/* Active Categories only */}
            {activeCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = cat === 'Toate' 
                ? notebooks.length 
                : notebooks.filter(n => n.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? 'bg-blue-500/50 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Notebooks Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          
          {/* Card 1: + Add Notebook (Google NotebookLM style) */}
          {!searchQuery.trim() && selectedCategory === 'Toate' && !onlyFavorites && !onlyAudio && (
            <div 
              onClick={() => {
                setEditingNotebook(null);
                setIsModalOpen(true);
              }}
              className="flex flex-col items-center justify-center min-h-[220px] rounded-2xl border-2 border-dashed border-slate-300 bg-white/40 p-6 text-center hover:border-blue-500 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-blue-500/60 dark:hover:bg-blue-950/20 transition-all duration-200 cursor-pointer group shadow-2xs"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400 transition shadow-2xs">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition">
                Notebook Nou
              </h3>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-400 max-w-[200px]">
                Creează un caiet nou sau importă documente din calculator
              </p>
            </div>
          )}

          {/* User Notebooks */}
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

        {/* Empty Search / Filter State */}
        {filteredNotebooks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
              Niciun notebook găsit
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Nu am găsit niciun notebook conform filtrelor sau căutării introduse.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Toate');
                setOnlyFavorites(false);
                setOnlyAudio(false);
              }}
              className="mt-4 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Resetează filtrele
            </button>
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
