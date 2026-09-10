'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  BookOpen, 
  Save, 
  Trash2, 
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
  Moon,
  ChevronLeft,
  ChevronRight,
  Settings,
  Scale,
  Search,
  Maximize2,
  FileCheck,
  Share2
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
  deleteSessionFromStorage
} from '@/lib/chatHistory';
import { 
  findArticleByPrompt, 
  findAllRelevantArticles, 
  searchArticlesByKeywords,
  formatLegalArticle,
  LegalArticle 
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
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Collapsible Sidebars State
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'notes' | 'audio' | 'legal'>('notes');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Notes state
  const [notesContent, setNotesContent] = useState(notebook.notes || '');
  const [isNotesSaved, setIsNotesSaved] = useState(true);

  // Source preview & modal inspector
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Add new source modal / inline
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [addSourceTab, setAddSourceTab] = useState<'upload' | 'manual'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceType, setNewSourceType] = useState<SourceType>('text');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');

  // Audio simulation state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioScript, setAudioScript] = useState<string | null>(
    notebook.audioOverviewStatus === 'generated'
      ? `Gazda 1: „Bine ați venit la analiza noastră despre ${notebook.title}. În documentele analizate, vedem o focalizare intensă pe eficiență și conformitate legală.”\nGazda 2: „Exact! Iar ceea ce mi s-a părut deosebit este cum se îmbină teoria normativă cu practica din cazurile analizate.”`
      : null
  );

  // Quick Legal Search inside Studio Tab
  const [legalSearchQuery, setLegalSearchQuery] = useState('');
  const [legalSearchResults, setLegalSearchResults] = useState<LegalArticle[]>([]);

  // Messages auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpenses(getStoredExpenses());

    // Reset document zoom back to normal 100% to avoid squishing panels
    if (typeof document !== 'undefined') {
      try {
        (document.body.style as any).zoom = '100%';
      } catch {}
    }

    // Theme setup
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
      const savedFont = (localStorage.getItem('notebooklm_font_size') as 'normal' | 'large' | 'xlarge') || 'normal';
      setFontSizeLevel(savedFont);
    } catch {}

    // Load Chat Sessions for this notebook
    const stored = getStoredSessions(notebook.id, notebook.title);
    setSessions(stored);
    if (stored.length > 0) {
      setCurrentSessionId(stored[0].id);
      setMessages(stored[0].messages);
    }
  }, [notebook.id, notebook.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // Handle Legal search in Studio Tab
  useEffect(() => {
    if (!legalSearchQuery.trim()) {
      setLegalSearchResults([]);
      return;
    }
    const found = searchArticlesByKeywords(legalSearchQuery, 5);
    setLegalSearchResults(found);
  }, [legalSearchQuery]);

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
      if (data?.reply) {
        const cleanReply = cleanDisplayReply(data.reply);
        finalMessages = [...updatedMessages, { role: 'assistant', text: cleanReply, timestamp: new Date().toISOString() }];
      } else {
        finalMessages = [...updatedMessages, { role: 'assistant', text: 'Eroare la obținerea răspunsului. Vă rugăm să verificați cheia API în setări.', timestamp: new Date().toISOString() }];
      }
      setMessages(finalMessages);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isLight = theme === 'light';

  // Dynamic font sizing for content readability
  const contentFontSizeClass = fontSizeLevel === 'xlarge'
    ? 'text-base sm:text-lg leading-relaxed'
    : fontSizeLevel === 'large'
    ? 'text-sm sm:text-base leading-relaxed'
    : 'text-xs sm:text-sm leading-normal';

  return (
    <div className={`flex h-screen flex-col ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'} overflow-hidden font-sans select-none`}>
      
      {/* ── TOP HEADER BAR ── */}
      <header className={`flex h-14 shrink-0 items-center justify-between border-b ${
        isLight ? 'border-slate-200 bg-white shadow-2xs' : 'border-slate-800/90 bg-slate-900'
      } px-4 z-20`}>
        
        {/* Left: Hub Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 ${
              isLight 
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title="Înapoi la lista de notebook-uri"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div className={`h-4 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-slate-800'} shrink-0`} />

          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 
              className={`text-sm sm:text-base font-bold tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
              title={notebook.title}
            >
              {notebook.title}
            </h1>
            <span className={`hidden md:inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
              isLight ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
            }`}>
              {notebook.category}
            </span>
          </div>
        </div>

        {/* Right: Model + Costs + Key + Settings Menu */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Model Selector Dropdown */}
          <div className="hidden sm:flex items-center">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={`text-xs font-medium rounded-lg border px-2.5 py-1.5 focus:outline-none cursor-pointer transition ${
                isLight 
                  ? 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 focus:border-blue-500' 
                  : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 focus:border-blue-500'
              }`}
              title="Alege modelul Gemini pentru interogări"
            >
              <option value="gemini-3.5-flash-lite">⚡ Gemini 3.5 Flash-Lite (Economic)</option>
              <option value="gemini-1.5-pro">🧠 Gemini 1.5 Pro (Juridic Avansat)</option>
              <option value="gemini-3.5-flash">🔥 Gemini 3.5 Flash</option>
              <option value="gemini-2.0-flash">⚡ Gemini 2.0 Flash</option>
              <option value="gemini-1.5-flash">⚡ Gemini 1.5 Flash</option>
            </select>
          </div>

          {/* Expense Tracker Pill */}
          <div className="relative">
            <button
              onClick={() => setShowExpenseDetails(!showExpenseDetails)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono transition cursor-pointer ${
                isLight 
                  ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs' 
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              title="Consum tokeni și costuri estimate Gemini API"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className={`font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                ${expenses.totalCostUSD.toFixed(3)}
              </span>
              <span className={`text-[10px] hidden md:inline opacity-70`}>
                (~{expenses.totalCostMDL.toFixed(1)} MDL)
              </span>
            </button>

            {/* Expense Popover */}
            {showExpenseDetails && (
              <div className={`absolute right-0 mt-2 w-72 rounded-2xl border p-4 shadow-xl z-50 text-xs ${
                isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-slate-800 bg-slate-900 text-slate-200'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <span className="font-bold flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    Cheltuieli API Gemini
                  </span>
                  <button
                    onClick={() => setShowExpenseDetails(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Cost Total USD:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${expenses.totalCostUSD.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Echivalent în MDL:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-300">
                      ~{expenses.totalCostMDL.toFixed(3)} MDL
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Tokeni Total:</span>
                    <span className="font-mono">{expenses.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pl-2">
                    <span>• Prompt (intrare):</span>
                    <span className="font-mono">{expenses.promptTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pl-2">
                    <span>• Output (răspuns):</span>
                    <span className="font-mono">{expenses.candidateTokens.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">{expenses.queriesCount} interogări</span>
                    <button
                      onClick={() => {
                        if (confirm('Resetați contorul de cheltuieli la $0.00?')) {
                          setExpenses(resetExpenses());
                        }
                      }}
                      className="text-rose-500 hover:underline cursor-pointer"
                    >
                      Resetează contorul
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* API Key Connect Pill */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer border ${
              hasApiKey
                ? isLight
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : isLight
                  ? 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100'
                  : 'border-purple-800/80 bg-purple-950/50 text-purple-300 hover:bg-purple-900/60'
            }`}
            title={hasApiKey ? 'Cheie Gemini API conectată' : 'Conectează cheia ta gratuită Gemini API'}
          >
            <Key className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{hasApiKey ? 'Gemini Activ' : 'Conectează API'}</span>
          </button>

          {/* Settings & Options Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsOptionsOpen(!isOptionsOpen)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isLight 
                  ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100' 
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              title="Setări interfață (Temă, Zoom, NotebookLM)"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Options Dropdown Menu */}
            {isOptionsOpen && (
              <div className={`absolute right-0 mt-2 w-64 rounded-2xl border p-3 shadow-xl z-50 text-xs space-y-3 ${
                isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-slate-800 bg-slate-900 text-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold">Opțiuni & Setări</span>
                  <button onClick={() => setIsOptionsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Theme Switcher */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Temă vizuală:</span>
                  <button
                    onClick={toggleTheme}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition cursor-pointer ${
                      isLight 
                        ? 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100' 
                        : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {isLight ? <Moon className="h-3.5 w-3.5 text-slate-600" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
                    <span>{isLight ? 'Mod Întunecat' : 'Mod Luminos'}</span>
                  </button>
                </div>

                {/* Text Size Control */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Mărime text:</span>
                  <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
                    <button
                      onClick={() => changeFontSize('normal')}
                      className={`px-2 py-0.5 rounded text-xs font-semibold transition ${
                        fontSizeLevel === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => changeFontSize('large')}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                        fontSizeLevel === 'large' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      A+
                    </button>
                    <button
                      onClick={() => changeFontSize('xlarge')}
                      className={`px-2 py-0.5 rounded text-xs font-extrabold transition ${
                        fontSizeLevel === 'xlarge' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      A++
                    </button>
                  </div>
                </div>

                {/* External NotebookLM Link */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsOptionsOpen(false);
                      openGoogleNotebookLmPopup();
                    }}
                    className="w-full flex items-center justify-between rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Google NotebookLM</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── 3-PANEL WORKSPACE ── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* ════════ COLUMN 1: SOURCES (Surse) ════════ */}
        {isLeftCollapsed ? (
          <aside className={`w-12 shrink-0 flex flex-col items-center py-3 border-r transition-all duration-200 ${
            isLight ? 'border-slate-200 bg-white text-slate-600' : 'border-slate-800/90 bg-slate-900 text-slate-400'
          }`}>
            <button
              onClick={() => setIsLeftCollapsed(false)}
              className="p-1.5 rounded-lg hover:bg-blue-600/10 hover:text-blue-600 transition cursor-pointer mb-4"
              title="Deschide panoul de surse"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4 text-xs font-semibold">
              <div 
                className="rotate-90 origin-left translate-x-3 text-[11px] uppercase tracking-wider text-slate-400 cursor-pointer"
                onClick={() => setIsLeftCollapsed(false)}
              >
                Surse ({notebook.sources?.length || 0})
              </div>
            </div>
          </aside>
        ) : (
          <aside className={`w-72 lg:w-80 shrink-0 flex flex-col border-r transition-all duration-200 ${
            isLight ? 'border-slate-200 bg-white' : 'border-slate-800/90 bg-slate-900'
          }`}>
            {/* Header of Sources */}
            <div className={`flex items-center justify-between border-b px-4 py-3 shrink-0 ${
              isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-950/40'
            }`}>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <h2 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Surse ({notebook.sources?.length || 0})
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setAddSourceTab('upload');
                    setIsAddingSource(!isAddingSource);
                  }}
                  className="flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 text-xs font-semibold shadow-2xs transition cursor-pointer"
                  title="Încarcă fișier PDF sau document"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adaugă</span>
                </button>
                <button
                  onClick={() => setIsLeftCollapsed(true)}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    isLight ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-700' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Restrânge panoul de surse"
                >
                  <ChevronLeft className="w-4 h-4" />
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

            {/* Add Source Drawer / Form */}
            {isAddingSource && (
              <div className={`border-b p-3 space-y-2.5 shrink-0 ${
                isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
              }`}>
                <div className={`flex rounded-lg p-0.5 text-xs ${isLight ? 'bg-slate-200/80' : 'bg-slate-900'}`}>
                  <button
                    type="button"
                    onClick={() => setAddSourceTab('upload')}
                    className={`flex-1 py-1 text-center font-semibold rounded-md transition ${
                      addSourceTab === 'upload' 
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Încarcă Fișier
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddSourceTab('manual')}
                    className={`flex-1 py-1 text-center font-semibold rounded-md transition ${
                      addSourceTab === 'manual' 
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-2xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Lipește Text
                  </button>
                </div>

                {addSourceTab === 'upload' ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                      isLight 
                        ? 'border-blue-300 bg-blue-50/50 hover:bg-blue-50' 
                        : 'border-blue-800 bg-blue-950/20 hover:bg-blue-900/30'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-1.5 py-1 text-blue-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-xs font-semibold">Se procesează fișierul...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Alege PDF, Word sau TXT
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click pentru a selecta</p>
                      </>
                    )}
                    {uploadError && <p className="text-[11px] text-rose-500 mt-1">{uploadError}</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Titlu document..."
                      value={newSourceTitle}
                      onChange={(e) => setNewSourceTitle(e.target.value)}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 ${
                        isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-900 text-white'
                      }`}
                    />
                    <textarea
                      rows={3}
                      placeholder="Lipește textul de analizat..."
                      value={newSourceContent}
                      onChange={(e) => setNewSourceContent(e.target.value)}
                      className={`w-full rounded-lg border p-2 text-xs focus:outline-none focus:border-blue-500 ${
                        isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-900 text-white'
                      }`}
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setIsAddingSource(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-600"
                      >
                        Anulează
                      </button>
                      <button
                        onClick={handleAddSource}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                      >
                        Salvează
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
                    onClick={() => {
                      setSelectedSource(s);
                      setIsSourceModalOpen(true);
                    }}
                    className={`group flex items-start gap-2.5 rounded-xl p-2.5 text-xs cursor-pointer border transition ${
                      selectedSource?.id === s.id
                        ? isLight 
                          ? 'border-blue-400 bg-blue-50/80 text-blue-950 shadow-2xs' 
                          : 'border-blue-500/50 bg-blue-950/30 text-white shadow-2xs'
                        : isLight 
                          ? 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 text-slate-800' 
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {s.type === 'pdf' && <FileText className="h-4 w-4 text-rose-500" />}
                      {s.type === 'web' && <Globe className="h-4 w-4 text-sky-500" />}
                      {s.type === 'youtube' && <Video className="h-4 w-4 text-red-500" />}
                      {s.type === 'drive' && <HardDrive className="h-4 w-4 text-emerald-500" />}
                      {(s.type === 'doc' || s.type === 'text') && <FileText className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-xs">{s.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                        <span className="uppercase font-medium">{s.type}</span>
                        <span>•</span>
                        <span>Click pentru lectură</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 px-3 text-slate-400">
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">Nicio sursă încărcată</p>
                  <p className="text-[11px] mt-1 text-slate-500">Adaugă fișiere pentru ca Gemini să le analizeze.</p>
                </div>
              )}
            </div>

          </aside>
        )}

        {/* ════════ COLUMN 2: CENTER CHAT (Conversație) ════════ */}
        <main className={`flex-1 flex flex-col min-w-0 overflow-hidden relative ${
          isLight ? 'bg-slate-50/50' : 'bg-slate-950'
        }`}>
          
          {/* Subheader of Chat */}
          <div className={`flex items-center justify-between border-b px-4 py-2 text-xs shrink-0 ${
            isLight ? 'border-slate-200 bg-white/70' : 'border-slate-800/80 bg-slate-900/60'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {isLeftCollapsed && (
                <button
                  onClick={() => setIsLeftCollapsed(false)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border transition cursor-pointer shrink-0 ${
                    isLight ? 'border-slate-200 hover:bg-slate-100 text-slate-600' : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Deschide sursele"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Surse</span>
                </button>
              )}
              
              <div 
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1.5 truncate cursor-pointer hover:underline text-slate-700 dark:text-slate-300 font-medium"
                title="Deschide istoricul de conversații"
              >
                <Archive className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="truncate">
                  {sessions.find(s => s.id === currentSessionId)?.title || 'Conversație nouă'}
                </span>
              </div>
            </div>

            {/* Chat Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleStartNewChat}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-semibold shadow-2xs transition cursor-pointer"
                title="Începe o conversație nouă"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Chat Nou</span>
              </button>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition cursor-pointer ${
                  isLight ? 'border-slate-200 hover:bg-slate-100 text-slate-700' : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
                title="Istoric conversații salvate"
              >
                <History className="w-3.5 h-3.5 text-purple-500" />
                <span>Istoric ({sessions.length})</span>
              </button>

              {isRightCollapsed && (
                <button
                  onClick={() => setIsRightCollapsed(false)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border transition cursor-pointer shrink-0 ${
                    isLight ? 'border-slate-200 hover:bg-slate-100 text-slate-600' : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Deschide panoul Studio & Notițe"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Studio</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6">
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[95%] sm:max-w-[90%] rounded-2xl p-4 sm:p-5 shadow-xs ${contentFontSizeClass} ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-xs shadow-md'
                        : isLight
                        ? 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/90 shadow-sm'
                        : 'bg-slate-900 text-slate-100 rounded-tl-xs border border-slate-800 shadow-md'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <div className="whitespace-pre-wrap font-medium">{m.text}</div>
                    ) : (
                      <FormattedMessage content={m.text} size={fontSizeLevel} theme={theme} />
                    )}

                    {m.role === 'assistant' && (
                      <div className={`mt-3 flex items-center justify-between border-t pt-2 text-xs select-none ${
                        isLight ? 'border-slate-100 text-slate-400' : 'border-slate-800 text-slate-500'
                      }`}>
                        <span className="text-[11px]">Răspuns generat pe baza notebook-ului</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => copyToClipboard(m.text, `msg-${idx}`)}
                            className={`flex items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
                              copiedId === `msg-${idx}` ? 'text-emerald-500' : 'hover:underline text-slate-500'
                            }`}
                          >
                            {copiedId === `msg-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === `msg-${idx}` ? 'Copiat' : 'Copiază'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setNotesContent(prev => prev + `\n\n---\n**Notă din Chat:**\n${m.text}`);
                              setIsNotesSaved(false);
                              setActiveStudioTab('notes');
                              setIsRightCollapsed(false);
                            }}
                            className="text-[11px] font-semibold text-blue-500 hover:underline cursor-pointer"
                          >
                            + În Notițe
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex items-center gap-2.5 text-xs text-blue-600 p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-semibold">Gemini procesează sursele notebook-ului...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Area: Suggested Chips & Floating Input */}
          <div className={`border-t px-4 py-3 shrink-0 ${
            isLight ? 'border-slate-200 bg-white/95 backdrop-blur-md' : 'border-slate-800/90 bg-slate-900/95 backdrop-blur-md'
          }`}>
            <div className="max-w-3xl mx-auto w-full space-y-2.5">
              
              {/* Quick Prompt Suggestions */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[11px] text-slate-400 shrink-0 font-medium mr-1">Sugestii:</span>
                <button
                  onClick={() => handleSendMessage('Fă o sinteză completă a surselor din acest notebook, evidențiind ideile principale.')}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                    isLight 
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300' 
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  📋 Rezumă sursele
                </button>
                <button
                  onClick={() => handleSendMessage('Generează un ghid de studiu și 5 întrebări de verificare pe baza acestui notebook.')}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                    isLight 
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300' 
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  🎓 Ghid de studiu
                </button>
                <button
                  onClick={() => handleSendMessage('Care sunt cele mai importante concluzii și pași practici pe care ar trebui să îi rețin?')}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                    isLight 
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300' 
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  💡 Puncte cheie
                </button>
              </div>

              {/* Chat Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Întreabă orice despre acest notebook sau legislația RM..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-blue-500 shadow-2xs ${
                    isLight 
                      ? 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400' 
                      : 'border-slate-700 bg-slate-950 text-white placeholder-slate-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !chatInput.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition shadow-xs cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

            </div>
          </div>

        </main>

        {/* ════════ COLUMN 3: STUDIO & NOTES (Tab-uri) ════════ */}
        {isRightCollapsed ? (
          <aside className={`w-12 shrink-0 flex flex-col items-center py-3 border-l transition-all duration-200 ${
            isLight ? 'border-slate-200 bg-white text-slate-600' : 'border-slate-800/90 bg-slate-900 text-slate-400'
          }`}>
            <button
              onClick={() => setIsRightCollapsed(false)}
              className="p-1.5 rounded-lg hover:bg-blue-600/10 hover:text-blue-600 transition cursor-pointer mb-4"
              title="Deschide panoul Studio"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-6 text-xs font-semibold">
              <button 
                onClick={() => {
                  setActiveStudioTab('notes');
                  setIsRightCollapsed(false);
                }}
                className="p-1 hover:text-purple-500 transition cursor-pointer"
                title="Notițe"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setActiveStudioTab('audio');
                  setIsRightCollapsed(false);
                }}
                className="p-1 hover:text-emerald-500 transition cursor-pointer"
                title="Podcast Audio"
              >
                <Headphones className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setActiveStudioTab('legal');
                  setIsRightCollapsed(false);
                }}
                className="p-1 hover:text-blue-500 transition cursor-pointer"
                title="Legislație RM"
              >
                <Scale className="w-4 h-4" />
              </button>
            </div>
          </aside>
        ) : (
          <aside className={`w-80 lg:w-96 shrink-0 flex flex-col border-l transition-all duration-200 ${
            isLight ? 'border-slate-200 bg-white' : 'border-slate-800/90 bg-slate-900'
          }`}>
            {/* Studio Tabs Header */}
            <div className={`flex items-center justify-between border-b px-2 py-2 shrink-0 ${
              isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-950/40'
            }`}>
              <div className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => setActiveStudioTab('notes')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeStudioTab === 'notes'
                      ? isLight ? 'bg-white text-purple-700 shadow-2xs border border-slate-200' : 'bg-slate-800 text-purple-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  <span>Notițe</span>
                </button>
                <button
                  onClick={() => setActiveStudioTab('audio')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeStudioTab === 'audio'
                      ? isLight ? 'bg-white text-emerald-700 shadow-2xs border border-slate-200' : 'bg-slate-800 text-emerald-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Audio</span>
                </button>
                <button
                  onClick={() => setActiveStudioTab('legal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeStudioTab === 'legal'
                      ? isLight ? 'bg-white text-blue-700 shadow-2xs border border-slate-200' : 'bg-slate-800 text-blue-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-blue-500" />
                  <span>Legislație RM</span>
                </button>
              </div>

              <button
                onClick={() => setIsRightCollapsed(true)}
                className={`p-1 rounded-md transition cursor-pointer ${
                  isLight ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-700' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                }`}
                title="Restrânge panoul Studio"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* TAB CONTENT 1: NOTIȚE (Notes) */}
            {activeStudioTab === 'notes' && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {notesContent.length} caractere
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(notesContent, 'notes-all')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                        copiedId === 'notes-all' ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {copiedId === 'notes-all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'notes-all' ? 'Copiat' : 'Copiază'}</span>
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      disabled={isNotesSaved}
                      className={`flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-semibold disabled:opacity-40 transition cursor-pointer ${
                        isLight 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100' 
                          : 'bg-purple-950/60 text-purple-300 border border-purple-800 hover:bg-purple-900/60'
                      }`}
                    >
                      <Save className="h-3 w-3" />
                      <span>{isNotesSaved ? 'Salvat' : 'Salvează'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={notesContent}
                  onChange={(e) => {
                    setNotesContent(e.target.value);
                    setIsNotesSaved(false);
                  }}
                  placeholder="Scrie notițe, rezumate sau idei juridice aici..."
                  className={`flex-1 w-full rounded-xl border p-3 text-xs sm:text-sm focus:outline-none focus:border-purple-500 resize-none leading-relaxed ${
                    isLight 
                      ? 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400' 
                      : 'border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-500'
                  }`}
                />
              </div>
            )}

            {/* TAB CONTENT 2: AUDIO OVERVIEW */}
            {activeStudioTab === 'audio' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <div className={`p-4 rounded-2xl border ${
                  isLight ? 'border-emerald-200 bg-emerald-50/50' : 'border-emerald-900/40 bg-emerald-950/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Sinteză Audio Podcast
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sinteză audio în două voci care discută punctele esențiale din notebook-ul curent.
                  </p>
                  
                  <div className="mt-3.5">
                    {audioScript ? (
                      <button
                        onClick={toggleAudioPlayback}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow transition cursor-pointer"
                      >
                        {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span>{isPlayingAudio ? 'Oprește Audio' : 'Ascultă Sinteza'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerateAudioOverview}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generează Podcast Audio</span>
                      </button>
                    )}
                  </div>
                </div>

                {audioScript && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Transcriere Script:
                    </span>
                    <div className={`p-3 rounded-xl border text-xs leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap ${
                      isLight ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-slate-800 bg-slate-950 text-slate-300'
                    }`}>
                      {audioScript}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: LEGISLAȚIE RM (Instant Search) */}
            {activeStudioTab === 'legal' && (
              <div className="flex-1 flex flex-col p-3 overflow-hidden space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Caută în Codul Penal, Civil, Executare..."
                    value={legalSearchQuery}
                    onChange={(e) => setLegalSearchQuery(e.target.value)}
                    className={`w-full rounded-xl border pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                      isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-700 bg-slate-950 text-white'
                    }`}
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5">
                  {legalSearchResults.length > 0 ? (
                    legalSearchResults.map((art, aIdx) => (
                      <div
                        key={aIdx}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          isLight ? 'border-slate-200 bg-white shadow-2xs' : 'border-slate-800 bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            Articolul {art.number} ({art.abbr})
                          </span>
                          <button
                            onClick={() => {
                              setNotesContent(prev => prev + `\n\n---\n**Articolul ${art.number} (${art.abbr}) - ${art.title}:**\n${art.text}`);
                              setIsNotesSaved(false);
                              alert('Articol adăugat în panoul de Notițe!');
                            }}
                            className="text-[11px] text-purple-600 hover:underline cursor-pointer"
                          >
                            + În Notițe
                          </button>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{art.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">{art.text}</p>
                      </div>
                    ))
                  ) : legalSearchQuery.trim() ? (
                    <p className="text-center text-xs text-slate-400 py-6">Niciun articol găsit conform căutării.</p>
                  ) : (
                    <div className="text-center text-slate-400 py-8 px-4 text-xs">
                      <Scale className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
                      <p className="font-semibold">Căutare Rapidă în Legislație</p>
                      <p className="text-[11px] mt-1 text-slate-500">
                        Scrie numărul unui articol sau un termen (ex: &quot;liberare conditionata&quot;, &quot;art 91&quot;, &quot;escorta&quot;) pentru a cita instant.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </aside>
        )}

      </div>

      {/* ── MODAL: SOURCE INSPECTOR (Lectură completă sursă) ── */}
      {isSourceModalOpen && selectedSource && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsSourceModalOpen(false)}
        >
          <div 
            className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                <h3 className="font-bold text-sm sm:text-base truncate">{selectedSource.title}</h3>
                <span className="rounded px-2 py-0.5 text-[10px] uppercase font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shrink-0">
                  {selectedSource.type}
                </span>
              </div>
              <button
                onClick={() => setIsSourceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {selectedSource.content || 'Această sursă nu are conținut textual extras încă.'}
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              {selectedSource.url ? (
                <a
                  href={selectedSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:underline font-medium"
                >
                  <span>Deschide Link Extern</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : <div />}

              <div className="flex items-center gap-2">
                {selectedSource.content && (
                  <button
                    onClick={() => copyToClipboard(selectedSource.content!, 'source-text')}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
                  >
                    {copiedId === 'source-text' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'source-text' ? 'Copiat' : 'Copiază Text'}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsSourceModalOpen(false)}
                  className="px-3.5 py-1 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500"
                >
                  Închide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CHAT HISTORY ── */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsHistoryOpen(false)}
        >
          <div 
            className={`w-full max-w-xl rounded-2xl border p-5 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-500" />
                <h3 className="text-sm sm:text-base font-bold">Istoricul Conversațiilor</h3>
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {sessions.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartNewChat}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  <span>+ Chat Nou</span>
                </button>
                <button onClick={() => setIsHistoryOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sessions.map((session) => {
                const isActive = session.id === currentSessionId;
                const dateStr = new Date(session.updatedAt || session.createdAt).toLocaleDateString('ro-RO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const userCount = session.messages.filter(m => m.role === 'user').length;

                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`flex items-start justify-between rounded-xl border p-3 transition cursor-pointer text-xs ${
                      isActive
                        ? isLight 
                          ? 'border-emerald-400 bg-emerald-50/70' 
                          : 'border-emerald-500/60 bg-emerald-950/20'
                        : isLight 
                          ? 'border-slate-200 bg-slate-50 hover:bg-white' 
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        <span className="truncate">{session.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {dateStr} • {userCount} întrebări ({session.messages.length} mesaje)
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded"
                      title="Șterge chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
