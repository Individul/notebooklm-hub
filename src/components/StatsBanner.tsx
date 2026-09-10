'use client';

import React from 'react';
import { BookOpen, Files, Headphones, Star, Tag } from 'lucide-react';
import { Notebook } from '@/lib/types';

interface StatsBannerProps {
  notebooks: Notebook[];
}

export function StatsBanner({ notebooks }: StatsBannerProps) {
  const totalNotebooks = notebooks.length;
  const totalSources = notebooks.reduce((acc, nb) => acc + (nb.sources?.length || 0), 0);
  const audioGenerated = notebooks.filter(nb => nb.audioOverviewStatus === 'generated').length;
  const totalFavorites = notebooks.filter(nb => nb.isFavorite).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {/* Stat 1: Total Notebooks */}
      <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Notebook-uri</p>
          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{totalNotebooks}</p>
        </div>
      </div>

      {/* Stat 2: Total Sources */}
      <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
          <Files className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Surse Conectate</p>
          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{totalSources}</p>
        </div>
      </div>

      {/* Stat 3: Audio Overviews */}
      <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
          <Headphones className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Audio Overviews</p>
          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{audioGenerated}</p>
        </div>
      </div>

      {/* Stat 4: Favorites */}
      <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
          <Star className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Favorite</p>
          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{totalFavorites}</p>
        </div>
      </div>
    </div>
  );
}
