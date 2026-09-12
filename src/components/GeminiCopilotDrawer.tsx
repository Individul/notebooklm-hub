'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Key, 
  Copy, 
  Check, 
  BookOpen, 
  HelpCircle, 
  FilePlus, 
  RefreshCw,
  Info
} from 'lucide-react';
import { Notebook } from '@/lib/types';
import { FormattedMessage } from './FormattedMessage';
import { cleanDisplayReply } from '@/lib/cleaner';
import { recordExpense } from '@/lib/expenseTracker';
import { callGeminiDirect } from '@/lib/geminiDirect';

interface GeminiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notebooks: Notebook[];
  onUpdateNotebookNotes?: (notebookId: string, additionalNotes: string) => void;
}

export function GeminiCopilotDrawer({
  isOpen,
  onClose,
  notebooks,
  onUpdateNotebookNotes,
}: GeminiCopilotDrawerProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  interface Message {
    role: 'user' | 'assistant';
    content: string;
    source?: string;
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Salut! Sunt asistentul tău **Gemini pentru NotebookLM** 🚀. 

Te pot ajuta să:
- Formulezi **întrebări analitice** excelente pentru sursele tale
- Descoperi **surse noi** (PDF-uri, articole, video-uri) pe care să le încarci în Google NotebookLM
- Creezi rezumate și planuri de studiu

Alege un notebook de mai jos sau scrie-mi direct!`,
    },
  ]);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_user_api_key') || '';
    setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('gemini_user_api_key', trimmed);
    setShowKeyInput(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSend = async (customPrompt?: string, mode?: 'generate_questions' | 'suggest_sources' | 'summarize' | 'chat') => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim()) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setPrompt('');
    setLoading(true);

    // Find context from selected notebook if any
    let contextStr = '';
    if (selectedNotebookId) {
      const selected = notebooks.find(n => n.id === selectedNotebookId);
      if (selected) {
        const sourcesText = selected.sources?.map(s => {
          let str = `[${s.type.toUpperCase()}] ${s.title}`;
          if (s.content) str += `:\n${s.content}`;
          else if (s.url) str += ` (Link: ${s.url})`;
          return str;
        }).join('\n\n---\n\n') || 'Niciuna';
        contextStr = `Notebook: "${selected.title}"\nDescriere: ${selected.description}\nCategorie: ${selected.category}\nSurse:\n${sourcesText}\n\nNotițe curente:\n${selected.notes || 'Niciuna'}`;
      }
    }

    const storedKey = apiKey.trim() || (typeof window !== 'undefined' ? localStorage.getItem('gemini_user_api_key') || '' : '');
    if (!storedKey) {
      setShowKeyInput(true);
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: '⚠️ Pentru a utiliza Gemini Copilot, te rog să introduci cheia ta Google Gemini API în câmpul de mai sus sau prin butonul cu cheie 🔑 din antet.' 
        },
      ]);
      setLoading(false);
      return;
    }

    const systemInstructionText = `Ești Gemini Copilot, asistentul inteligent juridic și documentar pentru NotebookLM Hub, specializat pe legislația REPUBLICII MOLDOVA.

REGULI FACTUALE STRICTE PRIVIND LEGISLAȚIA REPUBLICII MOLDOVA:
1. CADRU JURIDIC EXCLUSIV RM:
   - Folosești exclusiv actele normative din Republica Moldova (legis.md, Monitorul Oficial RM): Codul penal nr. 985/2002, Codul contravențional nr. 218/2008, Codul de procedură penală nr. 122/2003, Codul de executare nr. 443/2004 etc.
   - Interzisă invocarea legislației străine (România etc.).

2. REGULI CRUCIALE DIN CODUL PENAL AL REPUBLICII MOLDOVA (CP RM nr. 985/2002):
   - ART. 186 CP RM ESTE STRICT „FURTUL” (sustragerea pe ascuns a bunurilor altei persoane).
     * Nu folosi niciodată termenul de „pungășie” pentru art. 186!
     * „PUNGĂȘIA” este infracțiune complet separată, prevăzută la ART. 192 CP RM (sustragerea bunurilor din buzunare, genți sau alte obiecte prezente la persoană).
   - FRACȚIUNILE LA ART. 91 VS ART. 92 CP RM SE DEOSEBESC CLAR (Art. 92 NU preia fracțiunile de la art. 91!):
     * Art. 91 alin. (4) CP RM (Liberarea condiționată înainte de termen - adulți):
       - Infracțiuni ușoare sau mai puțin grave: cel puțin 1/2 (jumătate) din termen (dar nu mai puțin de 90 zile);
       - Infracțiuni grave, deosebit de grave sau excepțional de grave: cel puțin 2/3 (două treimi).
     * Art. 92 alin. (2) CP RM (Înlocuirea părții neexecutate a pedepsei cu o pedeapsă mai blândă):
       - Infracțiuni ușoare sau mai puțin grave: cel puțin 1/3 (o treime) din pedeapsă (diferit de 1/2 de la art. 91!);
       - Infracțiuni grave: cel puțin 1/2 (jumătate) din pedeapsă (diferit de 2/3 de la art. 91!);
       - Infracțiuni deosebit de grave sau excepțional de grave: cel puțin 2/3 (două treimi).
   - CLASIFICAREA INFRACȚIUNILOR (art. 16 CP RM):
     * Ușoare: max până la 2 ani închisoare.
     * Mai puțin grave: max până la 5 ani închisoare.
     * Grave: max până la 12 ani închisoare.
     * Deosebit de grave: pedeapsa maximă DEPĂȘEȘTE 12 ani de închisoare (ex: art. 151 alin. 4 - max 15 ani este DEOSEBIT DE GRAVĂ).
     * Excepțional de grave: detențiune pe viață.

3. DREPT CONTRAVENȚIONAL ȘI EXECUTARE RM:
   - 1 unitate convențională (u.c.) = 50 lei MDL (art. 34 alin. 1 CC RM).
   - Achitare a 50% din amendă în 3 zile lucrătoare (art. 34 alin. 3 CC RM).
   - Executarea hotărârilor contravenționale (art. 312 alin. 3 CE RM): Fiecare hotărâre privind sancțiuni contravenționale se execută separat (încheierile de arest nu se absorb și nu se contopesc).

Răspunde clar, structurat, bine formatat și exclusiv în limba română.`;

    const fullPrompt = `${contextStr ? `=== CONTEXTUL NOTEBOOK-ULUI SELECTAT ===\n${contextStr}\n\n` : ''}=== ÎNTREBAREA SAU CERINȚA UTILIZATORULUI ===\n${textToSend}`;

    try {
      const res = await callGeminiDirect({
        prompt: fullPrompt,
        systemInstruction: systemInstructionText,
        apiKey: storedKey
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.text, source: 'gemini-api' }
      ]);
    } catch (err: any) {
      const errMsg = err?.message || 'Eroare la contactarea Google Gemini API';
      const errLower = errMsg.toLowerCase();
      let friendlyError = `Eroare Google Gemini API: ${errMsg}`;

      if (
        errLower.includes('invalid authentication credentials') || 
        errLower.includes('expected oauth') ||
        errLower.includes('api key not valid') ||
        errLower.includes('invalid_argument')
      ) {
        friendlyError = `⚠️ **Cheia salvată nu este o cheie Gemini API validă.**

Google a respins datele de autentificare. Pentru a folosi asistentul în mod liber, ai nevoie de o **cheie API oficială gratuită** generată în Google AI Studio:

1. Intră pe **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)** (cu contul tău Google).
2. Apasă pe butonul albastru **„Create API key”**.
3. Copiază cheia creată (aceasta începe de regulă cu **\`AIzaSy...\`**).
4. Apasă pe iconița cu cheie 🔑 de sus și lipește noua cheie.`;
        setShowKeyInput(true);
      }

      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: friendlyError 
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  const currentSelectedNotebook = notebooks.find(n => n.id === selectedNotebookId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Gemini Copilot</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Asistent inteligent pentru NotebookLM</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`rounded-lg p-1.5 text-xs transition ${apiKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600'}`}
              title={apiKey ? 'Cheie API configurată' : 'Configurează Google Gemini API Key'}
            >
              <Key className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Optional API Key banner/dropdown */}
        {showKeyInput && (
          <div className="border-b border-slate-200 bg-purple-50/70 p-4 dark:border-slate-800 dark:bg-purple-950/30">
            <div className="flex items-start gap-2 text-xs text-purple-900 dark:text-purple-200">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Introduceți cheia dvs. Google Gemini API pentru răspunsuri live nelimitate. (Rămâne salvată strict în browser-ul dvs.).
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-xs dark:border-purple-800 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={() => handleSaveApiKey(apiKey)}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
              >
                Salvează
              </button>
            </div>
          </div>
        )}

        {/* Notebook Context Selector */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            Focalizare pe Notebook:
          </label>
          <select
            value={selectedNotebookId}
            onChange={(e) => setSelectedNotebookId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-xs focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">General (fără context specific)</option>
            {notebooks.map((nb) => (
              <option key={nb.id} value={nb.id}>
                {nb.title} ({nb.category})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 px-5 py-2 text-xs no-scrollbar dark:border-slate-800">
          <button
            onClick={() => handleSend(
              currentSelectedNotebook 
                ? `Generează o listă de întrebări analitice și profunde pentru notebook-ul "${currentSelectedNotebook.title}".` 
                : 'Generează o listă de întrebări analitice pe care să le adresez surselor mele în NotebookLM.',
              'generate_questions'
            )}
            className="shrink-0 flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
          >
            <HelpCircle className="h-3 w-3" />
            <span>Întrebări cheie</span>
          </button>

          <button
            onClick={() => handleSend(
              currentSelectedNotebook 
                ? `Sugerează cele mai bune tipuri de surse și materiale complementare pe care să le adaug în notebook-ul "${currentSelectedNotebook.title}".` 
                : 'Ce fel de surse și articole ar trebui să caut și să încarc în Google NotebookLM pentru a obține sinteze de calitate?',
              'suggest_sources'
            )}
            className="shrink-0 flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
          >
            <BookOpen className="h-3 w-3" />
            <span>Sugestii surse</span>
          </button>

          <button
            onClick={() => handleSend(
              currentSelectedNotebook 
                ? `Rezumă și structurează principalele idei pentru notebook-ul "${currentSelectedNotebook.title}" pe baza notițelor existente.` 
                : 'Cum structurez cel mai bine un rezumat executiv în NotebookLM?',
              'summarize'
            )}
            className="shrink-0 flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <FilePlus className="h-3 w-3" />
            <span>Sinteză</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`relative max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <FormattedMessage content={msg.content} />
                )}
                
                {msg.role === 'assistant' && (
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-400 dark:border-slate-700/60">
                    <span>{msg.source === 'gemini-api' ? '✨ Gemini Live' : '💡 Asistent Inteligent'}</span>
                    <div className="flex items-center gap-2">
                      {currentSelectedNotebook && onUpdateNotebookNotes && (
                        <button
                          onClick={() => {
                            onUpdateNotebookNotes(
                              currentSelectedNotebook.id,
                              `\n\n[Adăugat de Gemini Copilot]:\n${msg.content}`
                            );
                            alert(`Adăugat în notițele notebook-ului "${currentSelectedNotebook.title}"!`);
                          }}
                          className="hover:text-purple-600 dark:hover:text-purple-400 font-medium"
                          title="Salvează acest răspuns direct în notițele notebook-ului"
                        >
                          + Adaugă în Notițe
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(msg.content, index)}
                        className="hover:text-slate-700 dark:hover:text-slate-200"
                        title="Copiază textul"
                      >
                        {copiedIndex === index ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Gemini analizează și formulează răspunsul...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Întreabă Gemini sau cere idei pentru notebook..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-xs focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow hover:bg-purple-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
