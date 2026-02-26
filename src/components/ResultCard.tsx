'use client';

import { useTranslations } from 'next-intl';
import { FaDownload, FaImage, FaCheckCircle, FaSpinner, FaPlayCircle, FaTimes } from 'react-icons/fa';
import { useState } from 'react';

interface ResultCardProps {
    data: any;
    onClose: () => void;
}

export default function ResultCard({ data, onClose }: ResultCardProps) {
    const t = useTranslations('Downloader');

    if (!data) return null;

    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownload = async (url: string, filename: string, id: string) => {
        if (downloadingId) return; // Prevent multiple simultaneous downloads
        setDownloadingId(id);

        try {
            // Use proxy API to fetch as Blob and force download securely
            const proxyUrl = `/api/download-file?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            // Artificial delay so user sees the spinner
            await new Promise(resolve => setTimeout(resolve, 800));
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="w-full max-w-3xl mt-8 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-4 sm:p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">

            {/* Header Notification */}
            <div className="w-full flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full font-medium text-xs sm:text-sm">
                    <FaCheckCircle className="shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-full">{t('success')}</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-700/50 rounded-full p-2 flex items-center justify-center h-8 w-8"
                    aria-label="Close"
                >
                    <FaTimes className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full items-start">

                {/* Media Preview (Responsive) */}
                <div className="w-full md:w-56 shrink-0 aspect-[3/4] md:aspect-auto md:h-72 bg-slate-800 rounded-2xl overflow-hidden relative border border-slate-700/50 shadow-lg flex items-center justify-center">
                    {data.type === 'video' && (data.video?.sd || data.video?.hd) ? (
                        <video
                            src={data.video.sd || data.video.hd}
                            controls
                            playsInline
                            className="object-cover w-full h-full"
                            poster={data.cover || undefined}
                        />
                    ) : data.cover ? (
                        <img src={data.cover} alt="Cover" className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                    ) : (
                        <FaImage className="w-12 h-12 text-slate-600" />
                    )}
                </div>

                {/* Content Details & Actions */}
                <div className="flex-1 min-w-0 w-full flex flex-col gap-4">

                    {/* Meta Info */}
                    <div className="space-y-1.5 min-w-0 px-1">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-100 line-clamp-2 leading-tight break-words">
                            {data.title || 'TikTok Media'}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-400 font-medium text-sm truncate">
                            {data.author?.avatar ? (
                                <img src={data.author.avatar} alt="Avatar" className="w-5 h-5 rounded-full shrink-0" />
                            ) : null}
                            <span className="truncate">
                                {data.author?.nickname
                                    ? (data.author.nickname.startsWith('@') ? data.author.nickname : `@${data.author.nickname}`)
                                    : '@tiktok_user'}
                            </span>
                        </div>
                    </div>

                    {/* Download Buttons Area */}
                    <div className="bg-slate-800/30 rounded-2xl p-4 sm:p-5 border border-slate-700/30 space-y-3 sm:space-y-4 flex-1">

                        {/* Video Section */}
                        {data.type === 'video' && (data.video?.sd || data.video?.hd) && (
                            <div className="space-y-2.5">
                                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block">Video Download</span>

                                {data.video?.hd && (
                                    <button
                                        onClick={() => handleDownload(data.video.hd, `tiktok_hd_${Date.now()}.mp4`, 'hd')}
                                        disabled={!!downloadingId}
                                        className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all group shrink-0 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 text-[13px] sm:text-sm">
                                            {downloadingId === 'hd' ? <FaSpinner className="shrink-0 animate-spin" /> : <FaDownload className="shrink-0" />}
                                            <span className="truncate">Download HD (No Watermark)</span>
                                        </div>
                                        <span className="text-[10px] sm:text-xs bg-black/20 px-1.5 sm:px-2 py-0.5 rounded text-white font-mono shrink-0 ml-2">MP4</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => handleDownload(data.video?.sd || data.video?.hd, `tiktok_sd_${Date.now()}.mp4`, 'sd')}
                                    disabled={!!downloadingId}
                                    className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-200 rounded-xl font-medium transition-all group shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 text-[13px] sm:text-sm">
                                        {downloadingId === 'sd' ? <FaSpinner className="text-slate-400 shrink-0 animate-spin" /> : <FaDownload className="text-slate-400 group-hover:text-white transition-colors shrink-0" />}
                                        <span className="truncate">Download SD (Standard Quality)</span>
                                    </div>
                                    <span className="text-[10px] sm:text-xs bg-black/30 px-1.5 sm:px-2 py-0.5 rounded text-slate-400 font-mono shrink-0 ml-2">MP4</span>
                                </button>
                            </div>
                        )}

                        {/* Image Section */}
                        {data.type === 'image' && data.images && data.images.length > 0 && (
                            <div className="space-y-2.5">
                                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 flex items-center justify-between">
                                    Photo Slideshow
                                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">{data.images.length} Photos</span>
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
                                    {data.images.map((img: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => handleDownload(img, `tiktok_photo_${i}_${Date.now()}.jpeg`, `photo_${i}`)}
                                            disabled={!!downloadingId}
                                            className="relative aspect-square sm:aspect-[3/4] rounded-xl overflow-hidden group border border-slate-700/50 hover:border-pink-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            <img src={img} alt={`Slide ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            {/* Always visible on mobile to avoid hover issues, hidden until hover on sm screens */}
                                            <div className="absolute inset-x-0 bottom-0 p-2 sm:inset-0 sm:p-0 bg-gradient-to-t from-black/80 via-transparent to-transparent sm:bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-end sm:justify-center items-end sm:items-center">
                                                <div className="bg-pink-500 text-white p-2 sm:p-3 rounded-full shadow-lg">
                                                    {downloadingId === `photo_${i}` ? <FaSpinner className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <FaDownload className="w-3 h-3 sm:w-4 sm:h-4" />}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Audio Section */}
                        {data.music && data.music.playUrl && (
                            <div className="space-y-2.5 pt-1">
                                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1 block">Audio / Music</span>
                                <button
                                    onClick={() => handleDownload(data.music.playUrl, `tiktok_audio_${Date.now()}.mp3`, 'audio')}
                                    disabled={!!downloadingId}
                                    className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-white rounded-xl font-medium transition-all group shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2 text-[13px] sm:text-sm">
                                        {downloadingId === 'audio' ? <FaSpinner className="text-pink-400 shrink-0 animate-spin" /> : <FaDownload className="text-pink-400 group-hover:text-pink-300 transition-colors shrink-0" />}
                                        <span className="text-slate-200 block truncate">{data.music.title || 'Original Audio'}</span>
                                    </div>
                                    <span className="text-[10px] sm:text-xs bg-black/30 px-1.5 sm:px-2 py-0.5 rounded text-pink-300 font-mono shrink-0">MP3</span>
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
