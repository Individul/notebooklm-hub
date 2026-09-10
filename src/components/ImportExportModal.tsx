'use client';

import React, { useState } from 'react';
import { X, Download, Upload, FileText, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Notebook } from '@/lib/types';
import { 
  exportNotebooksAsJson, 
  exportNotebooksAsMarkdown, 
  INITIAL_NOTEBOOKS 
} from '@/lib/storage';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebooks: Notebook[];
  onImport: (newNotebooks: Notebook[]) => void;
}

export function ImportExportModal({
  isOpen,
  onClose,
  notebooks,
  onImport,
}: ImportExportModalProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    exportNotebooksAsJson(notebooks);
    setStatusMessage({ type: 'success', text: 'Fișierul JSON de backup a fost descărcat!' });
  };

  const handleExportMarkdown = () => {
    exportNotebooksAsMarkdown(notebooks);
    setStatusMessage({ type: 'success', text: 'Fișierul Markdown cu toate notele a fost descărcat!' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          onImport(parsed);
          setStatusMessage({ type: 'success', text: `Importate cu succes ${parsed.length} notebook-uri!` });
        } else {
          setStatusMessage({ type: 'error', text: 'Formatul JSON nu conține o listă validă de notebook-uri.' });
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Fișierul selectat nu este un JSON valid.' });
      }
    };
    reader.readAsText(file);
  };

  const handleManualImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        onImport(parsed);
        setStatusMessage({ type: 'success', text: `Importate cu succes ${parsed.length} notebook-uri!` });
        setJsonInput('');
      } else {
        setStatusMessage({ type: 'error', text: 'Formatul JSON trebuie să fie un array de obiecte.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Eroare de sintaxă în textul JSON introdus.' });
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Sigur doriți să resetați lista la notebook-urile demonstrative inițiale?')) {
      onImport(INITIAL_NOTEBOOKS);
      setStatusMessage({ type: 'success', text: 'Lista a fost resetată la notebook-urile demonstrative.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Backup, Export & Import</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Păstrează-ți salvate toate metadatele și link-urile către NotebookLM</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="mt-5 space-y-5">
          
          {/* Export Options */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider dark:text-slate-200">
              Opțiuni de Export
            </h3>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
              >
                <Download className="h-4 w-4 text-blue-600" />
                <span>Descarcă JSON</span>
              </button>

              <button
                onClick={handleExportMarkdown}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750"
              >
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>Descarcă Markdown</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider dark:text-slate-200">
              Import din Fișier Backup
            </h3>
            <label className="mt-2.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-4 text-center cursor-pointer hover:border-blue-500 dark:border-slate-700">
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="mt-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                Încarcă un fișier .json
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset to defaults */}
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Resetează la notebook-urile demonstrative inițiale</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            Închide
          </button>
        </div>

      </div>
    </div>
  );
}
