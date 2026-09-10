'use client';

import React, { useState } from 'react';
import { 
  ExternalLink, 
  Star, 
  Edit3, 
  Trash2, 
  FileText, 
  Globe, 
  Video, 
  HardDrive, 
  Copy, 
  Check, 
  Headphones, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { Notebook, SourceItem } from '@/lib/types';

interface NotebookCardProps {
  notebook: Notebook;
  onEdit: (notebook: Notebook) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenWorkspace: (notebook: Notebook) => void;
}

export function NotebookCard({ 
  notebook, 
  onEdit, 
  onDelete, 
  onToggleFavorite,
  onOpenWorkspace 
}: NotebookCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(notebook.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSourceIcon = (type: SourceItem['type']) => {
    switch (type) {
      case 'pdf':
      case 'doc':
      case 'text':
        return <FileText className="h-3 w-3 text-rose-500" />;
      case 'web':
        return <Globe className="h-3 w-3 text-sky-500" />;
      case 'youtube':
        return <Video className="h-3 w-3 text-red-500" />;
      case 'drive':
        return <HardDrive className="h-3 w-3 text-emerald-500" />;
      default:
        return <FileText className="h-3 w-3 text-slate-500" />;
    }
  };

  const formattedDate = new Date(notebook.updatedAt || notebook.createdAt).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <div 
      onClick={() => onOpenWorkspace(notebook)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700/60 cursor-pointer"
    >
      <div>
        {/* Top row: Category & Statuses */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {notebook.category}
          </span>
          
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {notebook.audioOverviewStatus === 'generated' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" title="Sinteză audio generată">
                <Headphones className="h-3 w-3" />
                <span className="hidden sm:inline">Podcast</span>
              </span>
            )}

            {/* Favorite button */}
            <button
              onClick={() => onToggleFavorite(notebook.id)}
              className="rounded-lg p-1 text-slate-400 transition hover:text-amber-500"
              title={notebook.isFavorite ? 'Elimină din favorite' : 'Adaugă la favorite'}
            >
              <Star className={`h-4 w-4 ${notebook.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition">
          {notebook.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 dark:text-slate-400 leading-relaxed">
          {notebook.description || 'Nicio descriere adăugată.'}
        </p>

        {/* Sources Preview Pills */}
        {notebook.sources && notebook.sources.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            {notebook.sources.slice(0, 2).map((source) => (
              <span
                key={source.id}
                className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/60 px-2 py-0.5 text-[10px] text-slate-600 max-w-[150px] truncate dark:bg-slate-800/80 dark:border-slate-700/60 dark:text-slate-300"
                title={source.title}
              >
                {getSourceIcon(source.type)}
                <span className="truncate">{source.title}</span>
              </span>
            ))}
            {notebook.sources.length > 2 && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                +{notebook.sources.length - 2} surse
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="h-3 w-3" />
          {formattedDate}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyUrl}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="Copiază link-ul"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          
          <button
            onClick={() => onEdit(notebook)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
            title="Editează caietul"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onDelete(notebook.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
            title="Șterge caietul"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <a
            href={notebook.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            title="Deschide în Google NotebookLM"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
}
