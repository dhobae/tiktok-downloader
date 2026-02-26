'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FaDownload } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface DownloaderFormProps {
    onResult: (result: any) => void;
    onError: (error: string) => void;
}

export default function DownloaderForm({ onResult, onError }: DownloaderFormProps) {
    const t = useTranslations('Downloader');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        if (!url.includes('tiktok.com')) {
            onError(t('invalidUrl'));
            return;
        }

        setIsLoading(true);
        onError('');

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                onResult(data.data);
            } else {
                onError(data.message || t('errorFetch'));
            }
        } catch (err) {
            onError(t('errorFetch'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mt-8">
            <div className="flex flex-col sm:flex-row items-stretch w-full gap-3 sm:gap-4">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t('placeholder')}
                    disabled={isLoading}
                    className="flex-1 min-w-0 px-6 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-500 outline-none backdrop-blur-md focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all shadow-inner disabled:opacity-70 disabled:cursor-not-allowed text-base md:text-lg"
                />

                <button
                    type="submit"
                    disabled={isLoading || !url}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-500/25 transition-all outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    {isLoading ? (
                        <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <FaDownload className="w-5 h-5" />
                            <span className="inline">{t('downloadLink')}</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
