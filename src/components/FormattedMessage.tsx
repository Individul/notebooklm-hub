'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface FormattedMessageProps {
  content: string;
  size?: 'normal' | 'large' | 'xlarge';
  theme?: 'light' | 'dark';
}

export function FormattedMessage({ content, size = 'large', theme = 'light' }: FormattedMessageProps) {
  const isLight = theme === 'light';

  const pClass = size === 'xlarge'
    ? `mb-4 last:mb-0 ${isLight ? 'text-slate-800' : 'text-slate-100'} leading-relaxed font-normal text-base sm:text-lg`
    : size === 'normal'
    ? `mb-2.5 last:mb-0 ${isLight ? 'text-slate-700' : 'text-slate-300'} leading-normal font-normal text-xs sm:text-sm`
    : `mb-3 last:mb-0 ${isLight ? 'text-slate-800' : 'text-slate-200'} leading-relaxed font-normal text-sm sm:text-base`;

  const h1Class = size === 'xlarge'
    ? `text-2xl sm:text-3xl font-bold ${isLight ? 'text-slate-900 border-slate-200' : 'text-white border-slate-700/60'} mt-4 mb-3 border-b pb-2`
    : size === 'normal'
    ? `text-base font-bold ${isLight ? 'text-slate-900 border-slate-200' : 'text-white border-slate-700/60'} mt-2 mb-1.5 border-b pb-1`
    : `text-lg sm:text-xl font-bold ${isLight ? 'text-slate-900 border-slate-200' : 'text-white border-slate-700/60'} mt-3.5 mb-2 border-b pb-1.5`;

  const h2Class = size === 'xlarge'
    ? `text-xl sm:text-2xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'} mt-4 mb-2.5 flex items-center gap-2`
    : size === 'normal'
    ? `text-sm font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'} mt-2 mb-1 flex items-center gap-1`
    : `text-base sm:text-lg font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'} mt-3 mb-2 flex items-center gap-1.5`;

  const h3Class = size === 'xlarge'
    ? `text-lg sm:text-xl font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'} mt-4 mb-2`
    : size === 'normal'
    ? `text-xs sm:text-sm font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'} mt-2 mb-1`
    : `text-base sm:text-lg font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'} mt-3 mb-1.5`;

  const listClass = size === 'xlarge'
    ? `my-3.5 ml-6 space-y-2.5 ${isLight ? 'text-slate-800' : 'text-slate-100'} text-base sm:text-lg`
    : size === 'normal'
    ? `my-2 ml-4 space-y-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'} text-xs sm:text-sm`
    : `my-2.5 ml-5 space-y-2 ${isLight ? 'text-slate-800' : 'text-slate-200'} text-sm sm:text-base`;

  const quoteClass = size === 'xlarge'
    ? `my-4 border-l-4 border-emerald-500 ${isLight ? 'bg-emerald-50/80 border-emerald-600 text-slate-900 border' : 'bg-slate-950/90 text-slate-100'} px-5 py-4 rounded-r-xl text-base sm:text-lg leading-relaxed shadow-md`
    : size === 'normal'
    ? `my-2 border-l-3 border-emerald-500 ${isLight ? 'bg-emerald-50/70 border-emerald-600 text-slate-900 border' : 'bg-slate-950/70 text-slate-300'} px-3 py-2 rounded-r-lg text-xs leading-normal shadow-xs`
    : `my-3 border-l-4 border-emerald-500 ${isLight ? 'bg-emerald-50/80 border-emerald-600 text-slate-900 border' : 'bg-slate-950/80 text-slate-200'} px-4 py-3 rounded-r-xl text-sm sm:text-[15px] leading-relaxed shadow-sm`;

  const codeClass = size === 'xlarge'
    ? `rounded ${isLight ? 'bg-slate-100 text-emerald-800 border-slate-300' : 'bg-slate-950 text-emerald-300 border-slate-800'} px-2.5 py-1 font-mono text-sm sm:text-base border`
    : size === 'normal'
    ? `rounded ${isLight ? 'bg-slate-100 text-emerald-800 border-slate-300' : 'bg-slate-950 text-emerald-300 border-slate-800'} px-1.5 py-0.5 font-mono text-[11px] border`
    : `rounded ${isLight ? 'bg-slate-100 text-emerald-800 border-slate-300' : 'bg-slate-950 text-emerald-300 border-slate-800'} px-2 py-0.5 font-mono text-xs sm:text-sm border`;

  return (
    <div className={`leading-relaxed ${isLight ? 'text-slate-800' : 'text-slate-200'} max-w-none`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className={h1Class}>{children}</h1>,
          h2: ({ children }) => <h2 className={h2Class}>{children}</h2>,
          h3: ({ children }) => <h3 className={h3Class}>{children}</h3>,
          p: ({ children }) => <p className={pClass}>{children}</p>,
          ul: ({ children }) => <ul className={`list-disc ${listClass}`}>{children}</ul>,
          ol: ({ children }) => <ol className={`list-decimal ${listClass}`}>{children}</ol>,
          li: ({ children }) => <li className={`leading-relaxed pl-1 ${isLight ? 'marker:text-emerald-600' : 'marker:text-emerald-400'}`}>{children}</li>,
          strong: ({ children }) => <strong className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{children}</strong>,
          em: ({ children }) => <em className={`italic ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{children}</em>,
          blockquote: ({ children }) => <blockquote className={quoteClass}>{children}</blockquote>,
          hr: () => <hr className={`my-3.5 ${isLight ? 'border-slate-200' : 'border-slate-700/60'}`} />,
          code: ({ children }) => <code className={codeClass}>{children}</code>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
