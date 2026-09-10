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
  HelpCircle,
  Clock
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
        return <FileText className="h-3.5 w-3.5 text-rose-500" />;
      case 'web':
        return <Globe className="h-3.5 w-3.5 text-sky-500" />;
      case 'youtube':
        return <Video className="h-3.5 w-3.5 text-red-500" />;
      case 'drive':
        return <HardDrive className="h-3.5 w-3.5 text-emerald-500" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const formattedDate = new Date(notebook.updatedAt || notebook.createdAt).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700/60">
      
      {/* Top row: Category & Favorite */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {notebook.category}
          </span>
          
          <div className="flex items-center gap-1.5">
            {/* Audio Overview indicator */}
            {notebook.audioOverviewStatus === 'generated' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" title="Audio Overview (Podcast) generat">
                <Headphones className="h-3 w-3" />
                <span className="hidden sm:inline">Podcast Gata</span>
              </span>
            )}
            {notebook.audioOverviewStatus === 'pending' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" title="Audio Overview în curs">
                <Headphones className="h-3 w-3" />
                <span className="hidden sm:inline">Podcast În Așteptare</span>
              </span>
            )}

            {/* Favorite button */}
            <button
              onClick={() => onToggleFavorite(notebook.id)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800"
              title={notebook.isFavorite ? 'Elimină din favorite' : 'Adaugă la favorite'}
            >
              <Star className={`h-4 w-4 ${notebook.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-base font-bold text-slate-900 line-clamp-1 dark:text-white">
          <a
            href={notebook.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
          >
            {notebook.title}
          </a>
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 dark:text-slate-400">
          {notebook.description || 'Fără descriere adițională.'}
        </p>

        {/* Sources list preview */}
        {notebook.sources && notebook.sources.length > 0 && (
          <div className="mt-3.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Surse atașate ({notebook.sources.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {notebook.sources.slice(0, 3).map((source) => (
                <span
                  key={source.id}
                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 max-w-[200px] truncate dark:bg-slate-800 dark:text-slate-300"
                  title={source.title}
                >
                  {getSourceIcon(source.type)}
                  <span className="truncate">{source.title}</span>
                </span>
              ))}
              {notebook.sources.length > 3 && (
                <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  +{notebook.sources.length - 3} altele
                </span>
              )}
            </div>
          </div>
        )}

        {/* Key questions count or badges */}
        {notebook.keyQuestions && notebook.keyQuestions.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="h-3 w-3" />
            <span>{notebook.keyQuestions.length} întrebări cheie formulate</span>
          </div>
        )}

        {/* Tags */}
        {notebook.tags && notebook.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {notebook.tags.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Metadata & Actions */}
      <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Clock className="h-3 w-3" />
            {formattedDate}
          </span>

          <div className="flex items-center gap-1">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyUrl}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Copiază link-ul direct către NotebookLM"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>

            {/* Edit Button */}
            <button
              onClick={() => onEdit(notebook)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
              title="Editează detaliile notebook-ului"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(notebook.id)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              title="Șterge din lista locală"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Open on Site & Open Official NotebookLM */}
        <div className="mt-3 grid grid-cols-12 gap-2">
          <button
            onClick={() => onOpenWorkspace(notebook)}
            className="col-span-8 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow"
            title="Deschide interfața interactivă de lucru direct pe site"
          >
            <span>Deschide pe Site</span>
          </button>

          <a
            href={notebook.url}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-4 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2 px-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750"
            title="Deschide în Google NotebookLM oficial"
          >
            <span>Google</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

    </div>
  );
}
