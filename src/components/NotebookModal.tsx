'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Link, ExternalLink, Sparkles, FileText, HelpCircle, UploadCloud, Loader2 } from 'lucide-react';
import { Notebook, SourceItem, DEFAULT_CATEGORIES, AudioStatus, SourceType } from '@/lib/types';
import { extractNotebookLmId, formatNotebookLmUrl } from '@/lib/storage';

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notebook: Notebook) => void;
  initialNotebook?: Notebook | null;
}

export function NotebookModal({ isOpen, onClose, onSave, initialNotebook }: NotebookModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[1]);
  const [urlInput, setUrlInput] = useState('');
  const [extractedId, setExtractedId] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('none');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [keyQuestions, setKeyQuestions] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const modalFileInputRef = React.useRef<HTMLInputElement>(null);

  // New source inputs
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceType, setNewSourceType] = useState<SourceType>('pdf');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  // New question input
  const [newQuestion, setNewQuestion] = useState('');

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.title) {
        const uploadedSource: SourceItem = {
          id: 'src-' + Date.now(),
          title: data.title,
          type: data.type || 'pdf',
          content: data.content || '',
        };
        setSources(prev => [...prev, uploadedSource]);
      } else {
        alert(data.error || 'Eroare la încărcarea fișierului.');
      }
    } catch (err) {
      alert('Eroare de rețea la încărcarea fișierului.');
    } finally {
      setIsUploading(false);
      if (modalFileInputRef.current) modalFileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (initialNotebook) {
      setTitle(initialNotebook.title);
      setDescription(initialNotebook.description);
      setCategory(initialNotebook.category);
      setUrlInput(initialNotebook.url);
      setExtractedId(initialNotebook.notebookLmId || extractNotebookLmId(initialNotebook.url));
      setAudioStatus(initialNotebook.audioOverviewStatus);
      setTagsInput(initialNotebook.tags ? initialNotebook.tags.join(', ') : '');
      setNotes(initialNotebook.notes || '');
      setSources(initialNotebook.sources || []);
      setKeyQuestions(initialNotebook.keyQuestions || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory(DEFAULT_CATEGORIES[1]);
      setUrlInput('');
      setExtractedId(null);
      setAudioStatus('none');
      setTagsInput('');
      setNotes('');
      setSources([]);
      setKeyQuestions([]);
    }
  }, [initialNotebook, isOpen]);

  if (!isOpen) return null;

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    const id = extractNotebookLmId(value);
    if (id) {
      setExtractedId(id);
    }
  };

  const handleAddSource = () => {
    if (!newSourceTitle.trim()) return;
    const newSource: SourceItem = {
      id: 'src-' + Date.now(),
      title: newSourceTitle.trim(),
      type: newSourceType,
      url: newSourceUrl.trim() || undefined,
    };
    setSources([...sources, newSource]);
    setNewSourceTitle('');
    setNewSourceUrl('');
  };

  const handleRemoveSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setKeyQuestions([...keyQuestions, newQuestion.trim()]);
    setNewQuestion('');
  };

  const handleRemoveQuestion = (index: number) => {
    setKeyQuestions(keyQuestions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedUrl = formatNotebookLmUrl(urlInput);
    const idFromUrl = extractNotebookLmId(formattedUrl);

    const tagsArray = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const now = new Date().toISOString();

    const notebookToSave: Notebook = {
      id: initialNotebook ? initialNotebook.id : 'nb-' + Date.now(),
      notebookLmId: idFromUrl || extractedId || undefined,
      title: title.trim(),
      description: description.trim(),
      category: category || 'Altele',
      url: formattedUrl,
      sources,
      tags: tagsArray,
      audioOverviewStatus: audioStatus,
      keyQuestions,
      notes: notes.trim(),
      isFavorite: initialNotebook ? initialNotebook.isFavorite : false,
      createdAt: initialNotebook ? initialNotebook.createdAt : now,
      updatedAt: now,
    };

    onSave(notebookToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialNotebook ? 'Editează Notebook' : 'Adaugă Notebook Google NotebookLM'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conectează un link direct din NotebookLM și organizează-i sursele
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* Notebook Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titlu Notebook *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Cercetare Arhitectură Cloud & LLMs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Link / URL NotebookLM */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Link sau ID Google NotebookLM
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="https://notebooklm.google.com/notebook/xxxx-xxxx... sau doar ID-ul"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 pl-9 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <Link className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
            {extractedId && (
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                ✓ ID extras cu succes: <code className="rounded bg-emerald-50 px-1 py-0.5 dark:bg-emerald-950/50">{extractedId}</code>
              </p>
            )}
          </div>

          {/* Category & Audio Status in 2 columns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {DEFAULT_CATEGORIES.filter(c => c !== 'Toate').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status Audio Overview (Podcast)
              </label>
              <select
                value={audioStatus}
                onChange={(e) => setAudioStatus(e.target.value as AudioStatus)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="none">Negenerat</option>
                <option value="pending">În așteptare / De generat</option>
                <option value="generated">Generat & Ascultat (Gata)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Descriere & Obiectiv
            </label>
            <textarea
              rows={2}
              placeholder="Despre ce este acest notebook și ce concluzii vrei să tragi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Etichete / Taguri (separate prin virgulă)
            </label>
            <input
              type="text"
              placeholder="AI, RAG, Tehnologie, Arhitectură"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Sources Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Surse documentare atașate ({sources.length})
              </label>
              <div>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.json,.csv"
                  onChange={handleModalFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-500 shadow-sm transition disabled:opacity-50"
                  title="Încarcă fișier PDF, Word sau TXT direct din calculator"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                  <span>{isUploading ? 'Se încarcă...' : 'Încarcă Fișier (PDF, TXT, DOC)'}</span>
                </button>
              </div>
            </div>
            
            {/* Existing sources list */}
            {sources.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {sources.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {s.type}
                      </span>
                      <span className="font-medium text-slate-800 truncate dark:text-slate-200">{s.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(s.id)}
                      className="ml-2 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new source inline */}
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-12">
              <input
                type="text"
                placeholder="Titlu sursă (ex: Ghid Arhitectură.pdf)"
                value={newSourceTitle}
                onChange={(e) => setNewSourceTitle(e.target.value)}
                className="sm:col-span-5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <select
                value={newSourceType}
                onChange={(e) => setNewSourceType(e.target.value as SourceType)}
                className="sm:col-span-3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="pdf">PDF</option>
                <option value="doc">Document</option>
                <option value="drive">Google Drive</option>
                <option value="web">Web Link</option>
                <option value="youtube">YouTube</option>
                <option value="text">Notițe text</option>
              </select>
              <input
                type="text"
                placeholder="URL opțional"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="sm:col-span-3 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddSource}
                className="sm:col-span-1 flex items-center justify-center rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"
                title="Adaugă sursă"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Key Questions Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Întrebări cheie pentru NotebookLM ({keyQuestions.length})
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Întrebările pe care vrei să le adresezi inteligenței artificiale pe baza surselor tale.
            </p>

            {keyQuestions.length > 0 && (
              <div className="space-y-1 mb-2.5">
                {keyQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{q}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-slate-400 hover:text-rose-500 ml-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adaugă o întrebare cheie..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Adaugă</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Notițe & Sinteze personale
            </label>
            <textarea
              rows={3}
              placeholder="Notițe rapide, idei reținute din podcastul audio sau concluzii..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
            >
              {initialNotebook ? 'Salvează Modificările' : 'Adaugă în Hub'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
