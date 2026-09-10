'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Send, 
  Sparkles, 
  FileText, 
  Globe, 
  Video, 
  HardDrive, 
  Headphones, 
  Plus, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  HelpCircle, 
  BookOpen, 
  Save, 
  Maximize2,
  Minimize2,
  Trash2,
  Volume2,
  UploadCloud,
  Loader2,
  Key,
  Coins,
  MessageSquarePlus,
  History,
  Clock,
  Archive,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { Notebook, SourceItem, SourceType } from '@/lib/types';
import { FormattedMessage } from './FormattedMessage';
import { cleanDisplayReply } from '@/lib/cleaner';
import { 
  getStoredExpenses, 
  recordExpense, 
  resetExpenses, 
  ExpenseStats, 
  INITIAL_EXPENSES 
} from '@/lib/expenseTracker';
import {
  ChatSession,
  ChatMessage,
  getStoredSessions,
  saveSession,
  createNewSession,
  deleteSessionFromStorage,
  getDefaultWelcomeMessage
} from '@/lib/chatHistory';
import { 
  findArticleByPrompt, 
  findAllRelevantArticles, 
  formatLegalArticle 
} from '@/lib/legislation/search';

interface NotebookWorkspaceProps {
  notebook: Notebook;
  onBack: () => void;
  onUpdateNotebook: (updated: Notebook) => void;
  onOpenAuth: () => void;
  hasApiKey: boolean;
}

export function NotebookWorkspace({ 
  notebook, 
  onBack, 
  onUpdateNotebook,
  onOpenAuth,
  hasApiKey
}: NotebookWorkspaceProps) {
  // Chat Sessions & History State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
  const [activeModel, setActiveModel] = useState<string>('gemini-3.5-flash-lite');
  const [expenses, setExpenses] = useState<ExpenseStats>(INITIAL_EXPENSES);
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setExpenses(getStoredExpenses());

    // Theme (Varianta Albă implicită)
    try {
      const savedTheme = (localStorage.getItem('notebooklm_theme') as 'light' | 'dark') || 'light';
      setTheme(savedTheme);
      if (typeof document !== 'undefined') {
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch {}

    try {
      const saved = (localStorage.getItem('notebooklm_font_size') as 'normal' | 'large' | 'xlarge') || 'large';
      setFontSizeLevel(saved);
      const zoomMap = {
        normal: '100%',
        large: '115%',
        xlarge: '130%',
      };
      if (typeof document !== 'undefined') {
        (document.body.style as any).zoom = zoomMap[saved] || '115%';
      }
    } catch {}

    // Load Chat Sessions for this notebook
    const stored = getStoredSessions(notebook.id, notebook.title);
    setSessions(stored);
    if (stored.length > 0) {
      setCurrentSessionId(stored[0].id);
      setMessages(stored[0].messages);
    }
  }, [notebook.id, notebook.title]);

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

  const changeFontSize = (lvl: 'normal' | 'large' | 'xlarge') => {
    setFontSizeLevel(lvl);
    try {
      localStorage.setItem('notebooklm_font_size', lvl);
      const zoomMap = {
        normal: '100%',
        large: '115%',
        xlarge: '130%',
      };
      if (typeof document !== 'undefined') {
        (document.body.style as any).zoom = zoomMap[lvl] || '115%';
      }
    } catch {}
  };

  const handleStartNewChat = () => {
    const newSession = createNewSession(notebook.id, notebook.title);
    saveSession(newSession);
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    setIsHistoryOpen(false);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setIsHistoryOpen(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Sigur doriți să ștergeți această conversație din istoric?')) return;
    const remaining = deleteSessionFromStorage(notebook.id, sessionId);
    if (remaining.length === 0) {
      const fresh = createNewSession(notebook.id, notebook.title);
      saveSession(fresh);
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
      setMessages(fresh.messages);
    } else {
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(remaining[0].id);
        setMessages(remaining[0].messages);
      }
    }
  };

  // Notes state
  const [notesContent, setNotesContent] = useState(notebook.notes || '');
  const [isNotesSaved, setIsNotesSaved] = useState(true);

  // Source preview
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(
    notebook.sources?.[0] || null
  );

  // Add new source modal / inline
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [addSourceTab, setAddSourceTab] = useState<'upload' | 'manual'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceType, setNewSourceType] = useState<SourceType>('text');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      let title = file.name;
      let textContent = '';
      let fileType: SourceType = 'text';

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.title) {
            title = data.title;
            textContent = data.content || '';
            fileType = data.type || 'pdf';
          }
        }
      } catch (uploadErr) {
        console.warn('API upload route unavailable, using client fallback:', uploadErr);
      }

      // Client-side fallback for static export / Cloudflare Pages
      if (!textContent) {
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          fileType = 'pdf';
          textContent = `[Fișier PDF: ${file.name} (${(file.size / 1024).toFixed(1)} KB) atașat pentru analiză]`;
        } else {
          try {
            textContent = await file.text();
            fileType = 'text';
          } catch {
            textContent = `[Fișier: ${file.name}]`;
          }
        }
      }

      const newSource: SourceItem = {
        id: 'src-' + Date.now(),
        title,
        type: fileType,
        content: textContent,
      };
      const updatedSources = [...(notebook.sources || []), newSource];
      const updated = {
        ...notebook,
        sources: updatedSources,
        updatedAt: new Date().toISOString(),
      };
      onUpdateNotebook(updated);
      setSelectedSource(newSource);
      setIsAddingSource(false);
    } catch (err: any) {
      setUploadError('Eroare la încărcare: ' + (err.message || 'Necunoscută'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Audio simulation state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioScript, setAudioScript] = useState<string | null>(
    notebook.audioOverviewStatus === 'generated'
      ? `Gazda 1: „Bine ați venit la analiza noastră despre ${notebook.title}. În documentele analizate, vedem o focalizare intensă pe eficiență și arhitectură modernă.”\nGazda 2: „Exact! Iar ceea ce mi s-a părut fascinant este cum se îmbină teoria cu practica din studiile de caz prezentate.”`
      : null
  );

  // Open Official Google NotebookLM in companion popup
  const openGoogleNotebookLmPopup = () => {
    const width = 1100;
    const height = 800;
    const left = window.screen.width - width;
    const top = 60;
    window.open(
      notebook.url,
      'GoogleNotebookLM_Window',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  const handleSendMessage = async (customText?: string) => {
    const query = customText || chatInput;
    if (!query.trim()) return;

    // Determine current active session
    let activeSessionId = currentSessionId;
    let currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      const fresh = createNewSession(notebook.id, notebook.title);
      saveSession(fresh);
      setSessions(prev => [fresh, ...prev]);
      activeSessionId = fresh.id;
      setCurrentSessionId(fresh.id);
      currentSession = fresh;
    }

    const userMessage: ChatMessage = { role: 'user', text: query, timestamp: new Date().toISOString() };
    const updatedMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!customText) setChatInput('');
    setIsAiLoading(true);

    // Auto-update session title if it was default
    let sessionTitle = currentSession.title;
    if (sessionTitle === 'Conversație nouă') {
      sessionTitle = query.length > 38 ? query.slice(0, 38).trim() + '...' : query.trim();
    }

    const sourcesSummary = notebook.sources?.map(s => {
      let str = `[${s.type.toUpperCase()}] ${s.title}`;
      if (s.content) str += `:\n${s.content}`;
      else if (s.url) str += ` (Link: ${s.url})`;
      return str;
    }).join('\n\n---\n\n') || 'Fără surse încărcate';
    
    const context = `Notebook: "${notebook.title}"\nDescriere: ${notebook.description}\n\nConținutul surselor analizate:\n${sourcesSummary}\n\nNotițe curente ale utilizatorului:\n${notesContent}`;

    try {
      const apiKey = localStorage.getItem('gemini_user_api_key') || '';
      let data: any = null;
      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            mode: 'chat',
            context,
            apiKey: apiKey || undefined,
            requestedModel: selectedModel,
          }),
        });

        if (res.ok) {
          data = await res.json();
        }
      } catch (fetchErr) {
        console.warn('Backend /api/gemini unreachable, attempting direct client fallback:', fetchErr);
      }

      // Direct client fallback if API route returned 404 or failed on static host
      if (!data && apiKey) {
        const relevantArticles = findAllRelevantArticles(query);
        let legalGroundingBlock = '';
        if (relevantArticles.length > 0) {
          legalGroundingBlock = `\n\n=== TEXTE OFICIALE DIN LEGISLAȚIA REPUBLICII MOLDOVA ===\n` +
            relevantArticles.map(a => formatLegalArticle(a)).join('\n\n---\n\n');
        }

        const candidateModels = [
          selectedModel,
          'gemini-3.5-flash-lite',
          'gemini-2.0-flash-lite',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-pro'
        ];
        const uniqueModels = Array.from(new Set(candidateModels));
        const fullPrompt = `${legalGroundingBlock}\n\n=== DOCUMENTE ȘI SURSE ===\n${context}\n\n=== ÎNTREBARE ===\n${query}`;

        for (const m of uniqueModels) {
          try {
            const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { temperature: 0.05, topP: 0.8 }
              })
            });
            if (directRes.ok) {
              const apiJson = await directRes.json();
              const text = apiJson.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const promptTokens = apiJson.usageMetadata?.promptTokenCount || Math.ceil(fullPrompt.length / 4);
                const candidateTokens = apiJson.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);
                data = {
                  reply: text,
                  model: m,
                  source: relevantArticles.length > 0 ? 'official-rm-legislation+gemini' : 'gemini-api',
                  usage: { promptTokens, candidateTokens }
                };
                break;
              }
            }
          } catch (mErr) {
            console.warn(`Direct model call to ${m} failed:`, mErr);
          }
        }

        // Guaranteed fallback to official legal article if models failed
        if (!data && relevantArticles.length > 0) {
          data = {
            reply: formatLegalArticle(relevantArticles[0]),
            source: 'official-rm-legislation'
          };
        }
      }

      if (data?.model) {
        setActiveModel(data.model);
      }
      if (data?.usage) {
        const updated = recordExpense(
          data.model || selectedModel,
          data.usage.promptTokens || 0,
          data.usage.candidateTokens || 0
        );
        setExpenses(updated);
      }
      
      let finalMessages: ChatMessage[] = [];
      if (data.reply) {
        const cleanReply = cleanDisplayReply(data.reply);
        finalMessages = [...updatedMessages, { role: 'assistant', text: cleanReply, timestamp: new Date().toISOString() }];
      } else {
        finalMessages = [...updatedMessages, { role: 'assistant', text: 'Eroare la obținerea răspunsului.', timestamp: new Date().toISOString() }];
      }
      setMessages(finalMessages);

      // Save updated session to persistent storage & state
      const now = new Date().toISOString();
      const updatedSession: ChatSession = {
        id: activeSessionId,
        notebookId: notebook.id,
        title: sessionTitle,
        createdAt: currentSession.createdAt || now,
        updatedAt: now,
        messages: finalMessages,
      };
      saveSession(updatedSession);
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === activeSessionId);
        if (idx !== -1) {
          const clone = [...prev];
          clone[idx] = updatedSession;
          return clone;
        }
        return [updatedSession, ...prev];
      });

    } catch (err) {
      const errorMsg: ChatMessage = { role: 'assistant', text: 'Eroare de conexiune cu asistentul.', timestamp: new Date().toISOString() };
      const withError = [...updatedMessages, errorMsg];
      setMessages(withError);
      const now = new Date().toISOString();
      const updatedSession: ChatSession = {
        id: activeSessionId,
        notebookId: notebook.id,
        title: sessionTitle,
        createdAt: currentSession.createdAt || now,
        updatedAt: now,
        messages: withError,
      };
      saveSession(updatedSession);
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === activeSessionId);
        if (idx !== -1) {
          const clone = [...prev];
          clone[idx] = updatedSession;
          return clone;
        }
        return [updatedSession, ...prev];
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveNotes = () => {
    const updated = {
      ...notebook,
      notes: notesContent,
      updatedAt: new Date().toISOString(),
    };
    onUpdateNotebook(updated);
    setIsNotesSaved(true);
  };

  const handleAddSource = () => {
    if (!newSourceTitle.trim()) return;
    const newSource: SourceItem = {
      id: 'src-' + Date.now(),
      title: newSourceTitle.trim(),
      type: newSourceType,
      url: newSourceUrl.trim() || undefined,
      content: newSourceContent.trim() || undefined,
    };
    const updatedSources = [...(notebook.sources || []), newSource];
    const updated = {
      ...notebook,
      sources: updatedSources,
      updatedAt: new Date().toISOString(),
    };
    onUpdateNotebook(updated);
    setSelectedSource(newSource);
    setNewSourceTitle('');
    setNewSourceUrl('');
    setNewSourceContent('');
    setIsAddingSource(false);
  };

  const handleGenerateAudioOverview = () => {
    const script = `Gazda 1 (Alex): „Bine ați venit la sinteza audio pentru ${notebook.title}. Avem o colecție captivantă de surse astăzi.”\n\nGazda 2 (Elena): „Categoric, Alex! Am analizat documentele încărcate și cel mai important punct este felul în care se leagă conceptele cheie: ${notebook.description || 'analiza aprofundată a materialelor'}.”\n\nGazda 1: „Iar concluzia practică pentru utilizator este să aplice aceste principii direct în proiectele de zi cu zi.”`;
    setAudioScript(script);
    const updated = {
      ...notebook,
      audioOverviewStatus: 'generated' as const,
      updatedAt: new Date().toISOString(),
    };
    onUpdateNotebook(updated);
  };

  const toggleAudioPlayback = () => {
    if ('speechSynthesis' in window && audioScript) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(audioScript.replace(/Gazda \d \([^)]+\):/g, ''));
        utterance.lang = 'ro-RO';
        utterance.rate = 1.05;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } else {
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const isLight = theme === 'light';

  return (
    <div className={`flex h-screen flex-col ${isLight ? 'bg-slate-100/70 text-slate-900' : 'bg-slate-900 text-slate-100'} overflow-hidden`}>
      
      {/* Top Navigation Bar */}
      <header className={`flex h-15 shrink-0 items-center justify-between border-b ${isLight ? 'border-slate-200 bg-white shadow-2xs' : 'border-slate-800 bg-slate-950'} px-5`}>
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              isLight 
                ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900' 
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Înapoi la Hub</span>
          </button>

          <div className={`h-5 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className={`text-base sm:text-lg font-bold tracking-tight line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {notebook.title}
              </h1>
              <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/60 text-blue-300'}`}>
                {notebook.category}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle (Mod Alb / Mod Întunecat) */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              isLight
                ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-2xs'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isLight ? 'Comută pe Modul Întunecat' : 'Comută pe Modul Alb (Luminos)'}
          >
            {isLight ? <Moon className="h-4 w-4 text-slate-600" /> : <Sun className="h-4 w-4 text-amber-400" />}
            <span className="hidden md:inline">{isLight ? 'Mod Întunecat' : 'Mod Alb'}</span>
          </button>

          {/* Font Size Adjuster Control */}
          <div className={`flex items-center gap-1 rounded-xl border p-1 text-xs shadow-xs ${isLight ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-slate-700 bg-slate-900/90 text-slate-300'}`}>
            <span className={`px-2 text-xs font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Zoom Text:</span>
            <button
              onClick={() => changeFontSize('normal')}
              className={`px-2.5 py-1 rounded-lg transition font-semibold ${
                fontSizeLevel === 'normal' 
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50 font-bold' 
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Text Normal (100%)"
            >
              A
            </button>
            <button
              onClick={() => changeFontSize('large')}
              className={`px-3 py-1 rounded-lg transition font-bold text-xs ${
                fontSizeLevel === 'large' 
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50 font-bold' 
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Text Mare (115% - Recomandat)"
            >
              A+
            </button>
            <button
              onClick={() => changeFontSize('xlarge')}
              className={`px-3 py-1 rounded-lg transition font-extrabold text-sm ${
                fontSizeLevel === 'xlarge' 
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50 font-bold' 
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Text Foarte Mare (130%)"
            >
              A++
            </button>
          </div>

          {/* Gemini AI Authentication Status Button */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold shadow-xs transition ${
              hasApiKey
                ? isLight
                  ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : isLight
                  ? 'border border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100'
                  : 'border border-purple-500/40 bg-purple-900/50 text-purple-200 hover:bg-purple-800/60'
            }`}
            title={hasApiKey ? 'Autentificat cu Google Gemini API' : 'Conectează cheia Google Gemini API pentru răspunsuri live'}
          >
            <Key className="h-4 w-4" />
            <span>{hasApiKey ? 'Gemini Conectat' : 'Conectare Gemini AI'}</span>
          </button>

          {/* Quick Open in Google NotebookLM companion popup */}
          <button
            onClick={openGoogleNotebookLmPopup}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition"
            title="Deschide Google NotebookLM într-o fereastră sincronizată alăturată"
          >
            <span>Deschide în Google NotebookLM</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 3-Column Split Workspace */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-12 overflow-hidden">
        
        {/* COLUMN 1: Sources (Surse) - 3 cols */}
        <div className={`hidden md:flex md:col-span-3 flex-col border-r ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950/60'} overflow-hidden`}>
          <div className={`flex items-center justify-between border-b p-4 ${isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/80'}`}>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <h2 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Surse ({notebook.sources?.length || 0})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAddSourceTab('upload');
                  setIsAddingSource(true);
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 shadow-sm transition cursor-pointer"
                title="Încarcă fișier PDF, Word sau TXT din calculator"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Încarcă Fișier</span>
              </button>

              <button
                onClick={() => {
                  setAddSourceTab('manual');
                  setIsAddingSource(true);
                }}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  isLight ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Lipește text sau link manual"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Text</span>
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.json,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Inline Add Source / Upload Form */}
          {isAddingSource && (
            <div className={`border-b p-3 space-y-3 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/95'}`}>
              
              {/* Tabs: Upload File vs Manual */}
              <div className={`flex rounded-lg p-1 text-xs ${isLight ? 'bg-slate-200/80' : 'bg-slate-950'}`}>
                <button
                  type="button"
                  onClick={() => setAddSourceTab('upload')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1 text-[11px] font-semibold transition ${
                    addSourceTab === 'upload'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Încarcă Fișier (PDF, TXT, DOC)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddSourceTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1 text-[11px] font-semibold transition ${
                    addSourceTab === 'manual'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Lipește Text / URL</span>
                </button>
              </div>

              {/* Tab 1: File Upload Dropzone */}
              {addSourceTab === 'upload' && (
                <div>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropFile}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition ${
                      isLight 
                        ? 'border-blue-400 bg-blue-50/60 hover:bg-blue-100/50' 
                        : 'border-blue-500/50 bg-blue-950/20 hover:bg-blue-950/30'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className={`mt-2 text-xs font-semibold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                          Se procesează și se extrage textul din fișier...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full mb-2 ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-600/20 text-blue-400'}`}>
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Apasă pentru a alege un fișier de pe calculator
                        </p>
                        <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          sau trage și plasează fișierul aici
                        </p>
                        <span className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-mono ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-400'}`}>
                          .PDF, .DOCX, .TXT, .MD, .CSV
                        </span>
                      </>
                    )}
                  </div>

                  {uploadError && (
                    <p className="mt-2 text-[11px] text-rose-400 font-medium">
                      ✕ {uploadError}
                    </p>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddingSource(false)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      Închide
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Manual Text / Link Input */}
              {addSourceTab === 'manual' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Titlu sursă..."
                    value={newSourceTitle}
                    onChange={(e) => setNewSourceTitle(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newSourceType}
                      onChange={(e) => setNewSourceType(e.target.value as SourceType)}
                      className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="text">Text Direct</option>
                      <option value="web">Web Link</option>
                      <option value="youtube">YouTube</option>
                      <option value="doc">Document</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <input
                      type="text"
                      placeholder="URL opțional..."
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">
                      Conținut text:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Lipește textul direct aici..."
                      value={newSourceContent}
                      onChange={(e) => setNewSourceContent(e.target.value)}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingSource(false)}
                      className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      Anulează
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSource}
                      className="rounded bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-500"
                    >
                      Salvează Sursă
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Sources List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {notebook.sources && notebook.sources.length > 0 ? (
              notebook.sources.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSource(s)}
                  className={`group flex items-start gap-3 rounded-xl p-3 text-xs sm:text-sm cursor-pointer transition ${
                    selectedSource?.id === s.id
                      ? isLight ? 'bg-blue-50 border border-blue-400 text-slate-900 shadow-xs ring-1 ring-blue-300' : 'bg-blue-600/20 border border-blue-500/40 text-white shadow-sm'
                      : isLight ? 'border border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 text-slate-800' : 'border border-slate-800/80 bg-slate-900/40 text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="mt-0.5 shrink-0 text-blue-500">
                    {s.type === 'pdf' && <FileText className="h-4 w-4 text-rose-500" />}
                    {s.type === 'web' && <Globe className="h-4 w-4 text-sky-500" />}
                    {s.type === 'youtube' && <Video className="h-4 w-4 text-red-500" />}
                    {s.type === 'drive' && <HardDrive className="h-4 w-4 text-emerald-500" />}
                    {s.type === 'doc' && <FileText className="h-4 w-4 text-amber-500" />}
                    {s.type === 'text' && <FileText className="h-4 w-4 text-indigo-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-xs sm:text-sm truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{s.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] uppercase font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{s.type}</span>
                      {s.content && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'}`}>
                          Text extras
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`flex flex-col items-center justify-center text-center py-8 px-4 rounded-xl border border-dashed ${isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-800 bg-slate-900/40'}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full mb-3 ${isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-600/10 text-blue-400'}`}>
                  <UploadCloud className="h-6 w-6" />
                </div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Încarcă fișiere din calculator</h3>
                <p className={`text-xs mt-1 max-w-[220px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Selectează orice fișier PDF, Word sau Text pentru a fi analizat de Gemini.
                </p>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3.5 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow hover:bg-blue-500 transition cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Alege Fișier</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAddSourceTab('manual');
                    setIsAddingSource(true);
                  }}
                  className={`mt-2 text-xs underline cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
                >
                  sau lipește text manual
                </button>
              </div>
            )}
          </div>

          {/* Selected Source Preview Box */}
          {selectedSource && (
            <div className={`border-t p-3.5 text-xs sm:text-sm ${isLight ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-slate-800 bg-slate-950 text-slate-300'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-semibold truncate ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{selectedSource.title}</span>
                {selectedSource.url && (
                  <a
                    href={selectedSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1 shrink-0 ml-1 font-medium"
                  >
                    <span>Link</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              {selectedSource.content ? (
                <div className={`mt-1.5 max-h-36 overflow-y-auto rounded-lg p-2.5 text-xs border leading-relaxed whitespace-pre-wrap ${isLight ? 'bg-white text-slate-800 border-slate-200 shadow-2xs' : 'bg-slate-900 text-slate-300 border-slate-800'}`}>
                  {selectedSource.content}
                </div>
              ) : (
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Sursă indexată pentru analiză și interogare AI.
                </p>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 2: Direct AI Chat (Interogare Surse) - 6 cols */}
        <div className={`col-span-1 md:col-span-6 flex flex-col ${isLight ? 'bg-slate-100/40' : 'bg-slate-900'} overflow-hidden`}>
          
          {/* AI Connection Status Banner & Chat Session Controls */}
          {!hasApiKey ? (
            <div className={`flex items-center justify-between border-b px-4 py-2 text-xs ${isLight ? 'border-purple-200 bg-purple-50 text-purple-900' : 'border-purple-800/60 bg-purple-950/60 text-purple-200'}`}>
              <div 
                onClick={onOpenAuth}
                className="flex items-center gap-2 truncate cursor-pointer hover:underline"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400 animate-pulse" />
                <span className="truncate">Mod Local. Conectează cheia gratuită pentru răspunsuri live Gemini</span>
                <span className={`font-bold underline shrink-0 ml-1 ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
                  → Conectează
                </span>
              </div>

              {/* Chat Session Actions */}
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  onClick={handleStartNewChat}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer"
                  title="Începe un chat nou, arhivând conversația curentă"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>+ Chat Nou</span>
                </button>
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    isLight 
                      ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-2xs' 
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title="Vezi conversațiile arhivate"
                >
                  <History className="w-3.5 h-3.5 text-purple-500" />
                  <span>Istoric ({sessions.length})</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-between border-b px-4 py-2 text-xs ${isLight ? 'border-slate-200 bg-white text-slate-800 shadow-2xs' : 'border-slate-800 bg-slate-950/70 text-emerald-400'}`}>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={`${isLight ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-2xs' : 'bg-slate-900 border-slate-700 text-emerald-300'} border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold cursor-pointer`}
                >
                  <option value="gemini-3.5-flash-lite">⚡ Gemini 3.5 Flash-Lite (Implicit & Economic)</option>
                  <option value="gemini-1.5-pro">🧠 Gemini 1.5 Pro (Recomandat Juridic)</option>
                  <option value="gemini-3.5-flash">🔥 Gemini 3.5 Flash (Generația Nouă)</option>
                  <option value="gemini-2.0-flash-lite">🌱 Gemini 2.0 Flash-Lite</option>
                  <option value="gemini-2.0-flash">⚡ Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-flash">⚡ Gemini 1.5 Flash</option>
                </select>

                {/* Live Expense Tracker Badge */}
                <div className="relative">
                  <button
                    onClick={() => setShowExpenseDetails(!showExpenseDetails)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition cursor-pointer text-xs font-mono shadow-2xs ${
                      isLight 
                        ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100' 
                        : 'border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400'
                    }`}
                    title="Click pentru a vizualiza detaliile de consum și costuri (USD / MDL)"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                      ${expenses.totalCostUSD.toFixed(4)}
                    </span>
                    <span className={`${isLight ? 'text-amber-800' : 'text-amber-200/90'} hidden sm:inline`}>
                      (~{expenses.totalCostMDL.toFixed(2)} MDL)
                    </span>
                    <span className={`${isLight ? 'text-slate-400' : 'text-slate-600'} hidden md:inline`}>|</span>
                    <span className={`${isLight ? 'text-slate-600' : 'text-slate-400'} hidden md:inline`}>
                      {expenses.totalTokens > 1000 
                        ? `${(expenses.totalTokens / 1000).toFixed(1)}k tok` 
                        : `${expenses.totalTokens} tok`}
                    </span>
                  </button>

                  {/* Expense Details Popover */}
                  {showExpenseDetails && (
                    <div className={`absolute left-0 mt-2 w-72 rounded-xl border p-4 shadow-2xl z-50 text-xs ${
                      isLight 
                        ? 'border-slate-200 bg-white text-slate-800 shadow-xl' 
                        : 'border-slate-700 bg-slate-900 text-slate-200'
                    }`}>
                      <div className={`flex items-center justify-between border-b pb-2.5 mb-2.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                        <span className={`font-bold flex items-center gap-2 text-xs ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                          <Coins className="w-4 h-4 text-amber-500" />
                          Cheltuieli Gemini API
                        </span>
                        <button
                          onClick={() => setShowExpenseDetails(false)}
                          className={`text-xs px-1 font-bold ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className={`flex justify-between items-center p-2 rounded-lg border ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                        }`}>
                          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Total USD:</span>
                          <span className={`font-bold font-mono text-xs sm:text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                            ${expenses.totalCostUSD.toFixed(5)}
                          </span>
                        </div>
                        <div className={`flex justify-between items-center p-2 rounded-lg border ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                        }`}>
                          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Total în Lei:</span>
                          <span className={`font-bold font-mono text-xs sm:text-sm ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                            ~{expenses.totalCostMDL.toFixed(3)} MDL
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Total tokeni utilizați:</span>
                          <span className={`font-mono font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                            {expenses.totalTokens.toLocaleString()}
                          </span>
                        </div>
                        <div className={`flex justify-between items-center text-[11px] pl-2 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          <span>• Întrebări (prompt in):</span>
                          <span className="font-mono">{expenses.promptTokens.toLocaleString()}</span>
                        </div>
                        <div className={`flex justify-between items-center text-[11px] pl-2 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          <span>• Răspunsuri (output):</span>
                          <span className="font-mono">{expenses.candidateTokens.toLocaleString()}</span>
                        </div>
                        
                        {expenses.lastQueryTokens > 0 && (
                          <div className={`border-t pt-2 mt-2 ${isLight ? 'border-slate-200' : 'border-slate-800/90'}`}>
                            <div className={`text-[11px] font-medium mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Ultima interogare:</div>
                            <div className="flex justify-between text-[11px]">
                              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Cost:</span>
                              <span className={`font-mono font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                ${expenses.lastQueryCostUSD.toFixed(5)} (~{expenses.lastQueryCostMDL.toFixed(3)} MDL)
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Tokeni:</span>
                              <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                                {expenses.lastQueryTokens.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className={`border-t pt-2 mt-2 flex justify-between items-center ${isLight ? 'border-slate-200' : 'border-slate-800/90'}`}>
                          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {expenses.queriesCount} {expenses.queriesCount === 1 ? 'interogare' : 'interogări'}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm('Resetați contorul de cheltuieli la $0.00?')) {
                                setExpenses(resetExpenses());
                              }
                            }}
                            className={`text-xs underline cursor-pointer font-medium ${isLight ? 'text-rose-600 hover:text-rose-700' : 'text-rose-400 hover:text-rose-300'}`}
                          >
                            Resetează contorul
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {activeModel && (
                  <span className={`text-xs font-mono hidden xl:inline ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    [{activeModel}]
                  </span>
                )}
              </div>

              {/* Chat Session Actions & Key Button */}
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  onClick={handleStartNewChat}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                  title="Începe o sesiune nouă de chat, arhivând conversația curentă"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>+ Chat Nou</span>
                </button>
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium text-xs transition cursor-pointer ${
                    isLight 
                      ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 shadow-2xs' 
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title="Vizualizează conversațiile anterioare din acest dosar"
                >
                  <History className="w-3.5 h-3.5 text-purple-500" />
                  <span>Istoric ({sessions.length})</span>
                </button>
                <button
                  onClick={onOpenAuth}
                  className={`text-xs underline shrink-0 ml-1 hidden sm:inline ${
                    isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cheie
                </button>
              </div>
            </div>
          )}

          {/* Active Session & Quick Prompts Bar */}
          <div className={`flex items-center justify-between border-b px-4 py-2.5 text-xs gap-3 ${
            isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-slate-950/40'
          }`}>
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <span className={`text-[11px] font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1.5 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <Archive className="w-3.5 h-3.5 text-purple-500" /> Chat:
              </span>
              <span 
                className={`text-xs font-semibold truncate cursor-pointer transition ${
                  isLight ? 'text-slate-800 hover:text-purple-600' : 'text-slate-200 hover:text-purple-300'
                }`}
                onClick={() => setIsHistoryOpen(true)}
                title="Click pentru a deschide istoricul conversațiilor"
              >
                {sessions.find(s => s.id === currentSessionId)?.title || 'Conversație nouă'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className={`text-[11px] hidden md:inline ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Comenzi:</span>
              <button
                onClick={() => handleSendMessage('Fă o sinteză completă a surselor din acest notebook, evidențiind ideile principale.')}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${
                  isLight 
                    ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs' 
                    : 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700'
                }`}
              >
                📋 Rezumă sursele
              </button>
              <button
                onClick={() => handleSendMessage('Generează un ghid de studiu și 5 întrebări de verificare pe baza acestui notebook.')}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${
                  isLight 
                    ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs' 
                    : 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700'
                }`}
              >
                🎓 Ghid de studiu
              </button>
              <button
                onClick={() => handleSendMessage('Care sunt cele mai importante concluzii și pași practici pe care ar trebui să îi rețin?')}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${
                  isLight 
                    ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs' 
                    : 'border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700'
                }`}
              >
                💡 Puncte cheie
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 ${isLight ? 'bg-slate-100/40' : ''}`}>
            {messages.map((m, idx) => {
              const fontSizeClass = fontSizeLevel === 'xlarge'
                ? 'text-base sm:text-lg leading-relaxed'
                : fontSizeLevel === 'large'
                ? 'text-sm sm:text-base leading-relaxed'
                : 'text-xs sm:text-sm leading-normal';

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-xs ${fontSizeClass} ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-xs shadow-md'
                        : isLight
                        ? 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/90 shadow-sm'
                        : 'bg-slate-800/95 text-slate-100 rounded-tl-xs border border-slate-700/80 shadow-md'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <div className="whitespace-pre-wrap font-medium">{m.text}</div>
                    ) : (
                      <FormattedMessage content={m.text} size={fontSizeLevel} theme={theme} />
                    )}

                    {m.role === 'assistant' && (
                      <div className={`mt-3.5 flex items-center justify-between border-t pt-2.5 text-xs ${
                        isLight ? 'border-slate-200 text-slate-500' : 'border-slate-700/60 text-slate-400'
                      }`}>
                        <span>Răspuns generat pe baza notebook-ului</span>
                        <button
                          onClick={() => {
                            setNotesContent(prev => prev + `\n\n---\n**Notă din Chat:**\n${m.text}`);
                            setIsNotesSaved(false);
                            alert('Adăugat în panoul de Notițe!');
                          }}
                          className={`font-semibold text-xs cursor-pointer ${
                            isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                          }`}
                        >
                          + Salvează în Notițe
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isAiLoading && (
              <div className={`flex items-center gap-2.5 text-sm p-2 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-r-transparent" />
                <span className="font-medium">Gemini procesează sursele notebook-ului...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className={`border-t p-3 sm:p-4 ${
            isLight ? 'border-slate-200 bg-white shadow-xs' : 'border-slate-800 bg-slate-950/90'
          }`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Întreabă orice despre acest notebook sau legislația RM..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none shadow-xs ${
                  isLight 
                    ? 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400' 
                    : 'border-slate-700 bg-slate-900 text-white placeholder-slate-500'
                }`}
              />
              <button
                type="submit"
                disabled={isAiLoading || !chatInput.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-sm cursor-pointer"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>

        </div>

        {/* COLUMN 3: Studio & Notes (Notițe & Audio Overview) - 3 cols */}
        <div className={`hidden md:flex md:col-span-3 flex-col border-l overflow-hidden ${
          isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-950/60'
        }`}>
          
          {/* Audio Overview Card */}
          <div className={`border-b p-4 ${isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-900/50'}`}>
            <div className="flex items-center justify-between mb-2.5">
              <div className={`flex items-center gap-2 text-xs sm:text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <Headphones className="h-4 w-4 text-emerald-500" />
                <span>Audio Overview (Podcast)</span>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                audioScript 
                  ? isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-900/60 text-emerald-300' 
                  : isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
              }`}>
                {audioScript ? 'Disponibil' : 'Negenerat'}
              </span>
            </div>

            {audioScript ? (
              <div className="space-y-2.5">
                <p className={`text-xs sm:text-[13px] line-clamp-3 italic leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  &quot;{audioScript.slice(0, 140)}...&quot;
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={toggleAudioPlayback}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-500 transition shadow-xs cursor-pointer"
                  >
                    {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span>{isPlayingAudio ? 'Oprește Audio' : 'Ascultă Sinteza'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className={`text-xs sm:text-[13px] mb-3 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Generează o discuție audio în două voci care sintetizează acest notebook.
                </p>
                <button
                  onClick={handleGenerateAudioOverview}
                  className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-xs cursor-pointer"
                >
                  Generează Podcast Audio
                </button>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className={`flex items-center gap-2 text-xs sm:text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <FileText className="h-4 w-4 text-purple-500" />
                <span>Notițele Mele</span>
              </div>
              <button
                onClick={handleSaveNotes}
                disabled={isNotesSaved}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-40 transition cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-2xs' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isNotesSaved ? 'Salvat' : 'Salvează'}</span>
              </button>
            </div>

            <textarea
              value={notesContent}
              onChange={(e) => {
                setNotesContent(e.target.value);
                setIsNotesSaved(false);
              }}
              placeholder="Scrie notițe, idei sau copiază pasaje din chat aici..."
              className={`flex-1 w-full rounded-xl border p-3.5 text-xs sm:text-sm focus:border-purple-500 focus:outline-none resize-none leading-relaxed shadow-2xs ${
                isLight 
                  ? 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400' 
                  : 'border-slate-800 bg-slate-900 text-slate-200 placeholder-slate-500'
              }`}
            />
          </div>

        </div>

      </div>

      {/* Chat History Drawer / Modal */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div 
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-4 mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isLight ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                }`}>
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <span>Istoricul Conversațiilor</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isLight ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-800 text-purple-300 border border-slate-700'
                    }`}>
                      {sessions.length} {sessions.length === 1 ? 'chat' : 'chaturi'}
                    </span>
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Selectează o conversație anterioară pentru a o continua sau începe un chat nou.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartNewChat}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-2xs hover:bg-emerald-500 transition cursor-pointer"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  <span>+ Chat Nou</span>
                </button>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className={`rounded-lg p-2 transition cursor-pointer ${
                    isLight ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
              {sessions.length === 0 ? (
                <div className={`text-center py-12 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nu există nicio conversație salvată în acest notebook.</p>
                </div>
              ) : (
                sessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  const dateStr = new Date(session.updatedAt || session.createdAt).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const userQueriesCount = session.messages.filter(m => m.role === 'user').length;
                  const lastMessage = session.messages[session.messages.length - 1];

                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={`group relative flex items-start justify-between rounded-xl border p-4 transition cursor-pointer ${
                        isActive
                          ? isLight
                            ? 'border-emerald-400 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-300'
                            : 'border-emerald-500/60 bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/30'
                          : isLight
                          ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800 shadow-2xs'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40 text-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {isActive && (
                            <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              isLight 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Activ Acum
                            </span>
                          )}
                          <span className={`font-semibold text-sm truncate transition ${
                            isLight ? 'text-slate-900 group-hover:text-purple-700' : 'text-slate-100 group-hover:text-purple-300'
                          }`}>
                            {session.title}
                          </span>
                        </div>

                        {lastMessage && (
                          <p className={`text-xs line-clamp-1 italic mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {lastMessage.role === 'user' ? 'Tu: ' : 'AI: '}
                            {lastMessage.text.replace(/[#*`_]/g, '')}
                          </p>
                        )}

                        <div className={`flex items-center gap-3 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {dateStr}
                          </span>
                          <span>•</span>
                          <span>
                            {userQueriesCount} {userQueriesCount === 1 ? 'întrebare' : 'întrebări'} ({session.messages.length} mesaje)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className={`opacity-60 hover:opacity-100 p-2 rounded-lg transition cursor-pointer ${
                            isLight 
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30'
                          }`}
                          title="Șterge această conversație"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className={`border-t pt-3 mt-3 flex items-center justify-between text-xs ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              <span className="flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                Conversațiile sunt salvate automat local și nu se pierd la reîncărcare.
              </span>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
