'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import DownloaderForm from '@/components/DownloaderForm';
import ResultCard from '@/components/ResultCard';

export default function Home() {
  const t = useTranslations('Downloader');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 relative bg-slate-950/80 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] selection:bg-pink-500/30">

      {/* Header with Language Switcher */}
      <div className="w-full max-w-4xl flex justify-end mb-8 md:mb-16 z-20">
        <LanguageSwitcher />
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center">

        {/* Title Area */}
        <div className="flex flex-col items-center text-center space-y-4 md:space-y-6 mb-10 w-full">
          <div className="inline-flex items-center p-1 px-3 rounded-full bg-slate-900/80 border border-slate-700/50 text-slate-300 text-xs sm:text-sm font-medium shadow-sm backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-pink-500 mr-2 animate-pulse"></span>
            {t('title')}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 drop-shadow-sm pb-2">
            TikTok Downloader
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl font-sans font-light px-4">
            {t('subtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-2xl mb-4 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center justify-center text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Input Form */}
        <div className="w-full px-4 sm:px-0">
          <DownloaderForm onResult={setResult} onError={setError} />
        </div>

        {/* Result Area */}
        {result && (
          <ResultCard data={result} onClose={() => setResult(null)} />
        )}

      </div>
    </main>
  );
}
