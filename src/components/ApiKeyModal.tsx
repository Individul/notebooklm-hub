'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle, ExternalLink, Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export function ApiKeyModal({ isOpen, onClose, onKeySaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gemini_user_api_key') || '';
      setApiKey(saved);
      if (saved) {
        setStatus('valid');
        setStatusMsg('Cheie Gemini API salvată și activă!');
      } else {
        setStatus('idle');
        setStatusMsg('');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem('gemini_user_api_key');
      onKeySaved('');
      setStatus('idle');
      setStatusMsg('Cheia a fost ștearsă. Aplicația va rula în modul local.');
      return;
    }

    setStatus('testing');
    setStatusMsg('Se verifică conexiunea cu serverele Google Gemini...');

    try {
      let isSuccess = false;

      // 1. Încercare prin API route intern (dacă serverul este activ)
      try {
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'Răspunde doar cu cuvântul OK.',
            mode: 'chat',
            apiKey: trimmed,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.source === 'gemini-api' || data.reply) {
            isSuccess = true;
          }
        }
      } catch (e) {
        // Continuă cu verificarea directă pe client
      }

      // 2. Verificare directă cu serverele Google (esențial pe Cloudflare Pages static)
      if (!isSuccess) {
        const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmed)}`);
        if (directRes.ok) {
          isSuccess = true;
        } else {
          if (directRes.status === 400 || directRes.status === 401 || directRes.status === 403) {
            setStatus('invalid');
            setStatusMsg('Cheia nu este validă pentru Google Gemini. Cheia oficială se creează în Google AI Studio și începe de regulă cu "AIzaSy...".');
            return;
          }
        }
      }

      if (isSuccess) {
        localStorage.setItem('gemini_user_api_key', trimmed);
        onKeySaved(trimmed);
        setStatus('valid');
        setStatusMsg('✓ Conexiune reușită cu Google Gemini! Modelul răspunde în timp real.');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatus('invalid');
        setStatusMsg('Cheia nu a putut fi validată de Google Gemini. Verificați dacă ați copiat-o corect din aistudio.google.com.');
      }
    } catch (err: any) {
      setStatus('invalid');
      setStatusMsg('Eroare de rețea la contactarea Google Gemini API.');
    }
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('gemini_user_api_key');
    setApiKey('');
    onKeySaved('');
    setStatus('idle');
    setStatusMsg('Cheia a fost eliminată.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Autentificare Google Gemini
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Activează răspunsurile generative live ale AI-ului
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          
          {/* Explanation Banner */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-200 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>De ce este necesară o cheie Google API?</span>
            </p>
            Pentru ca aplicația să poată „gândi”, citi documentele încărcate și formula răspunsuri complete prin modelul <strong>Gemini 1.5 Flash</strong>, are nevoie de acces la API-ul Google.
          </div>

          {/* How to get key step-by-step */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/60">
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Cum obții o cheie gratuită (în 30 de secunde):
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                Accesează{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Google AI Studio</span>
                  <ExternalLink className="h-3 w-3 inline" />
                </a>
              </li>
              <li>Autentifică-te cu contul tău Google obișnuit.</li>
              <li>Apasă pe butonul albastru <strong>„Create API key”</strong>.</li>
              <li>Copiază cheia generată (începe cu <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">AIzaSy...</code>) și lipește-o mai jos.</li>
            </ol>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cheia ta Google Gemini API:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-3.5 pr-10 text-xs font-mono text-slate-900 shadow-sm focus:border-purple-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Status feedback */}
          {statusMsg && (
            <div
              className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
                status === 'valid'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : status === 'invalid'
                  ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
              }`}
            >
              {status === 'valid' ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : status === 'invalid' ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              ) : (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
              )}
              <span className="leading-relaxed">{statusMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            {apiKey && (
              <button
                type="button"
                onClick={handleRemoveKey}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium"
              >
                Deconectează / Șterge
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleTestAndSave}
                disabled={status === 'testing'}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-purple-700 transition disabled:opacity-50"
              >
                {status === 'testing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{status === 'testing' ? 'Verificare...' : 'Conectează & Salvează'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
