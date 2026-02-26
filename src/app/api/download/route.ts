import { NextResponse } from 'next/server';
import TiktokDL from '@tobyg74/tiktok-api-dl';
// Explicitly import from the library - standard import doesn't always work exactly as documented in these scraper libs
const tiktokScraper = require('tiktok-scraper-without-watermark');

// Standardized Output Format
export interface DownloaderResponse {
    type: 'video' | 'image';
    title: string;
    cover: string;
    author: {
        nickname: string;
        avatar: string;
    };
    video?: {
        hd?: string;
        sd?: string;
        watermark?: string;
    };
    images?: string[];
    music?: {
        title: string;
        playUrl: string;
    };
}

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url || !url.includes('tiktok.com')) {
            return NextResponse.json({ status: 'error', message: 'Invalid TikTok URL provided.' }, { status: 400 });
        }

        // ==========================================
        // STRATEGY 1: @tobyg74/tiktok-api-dl
        // ==========================================
        try {
            console.log('Attempting Strategy 1: @tobyg74/tiktok-api-dl (v3 & v1)');
            const [result3, result1] = await Promise.all([
                TiktokDL.Downloader(url, { version: "v3" }).catch(() => null),
                TiktokDL.Downloader(url, { version: "v1" }).catch(() => null)
            ]);

            const res3 = result3?.status === 'success' ? result3.result as any : null;
            const res1 = result1?.status === 'success' ? result1.result as any : null;

            if (res3 || res1) {
                const isImage = res3?.type === 'image' || res1?.type === 'image' || (res3?.images && res3.images.length > 0) || (res1?.images && res1.images.length > 0);

                const videoHD = res3?.videoHD || '';
                let videoSD = res3?.videoSD || '';

                // Fallback for SD if v3 didn't return SD properly
                if (!videoSD && res1?.video?.playAddr && res1.video.playAddr.length > 0) {
                    videoSD = res1.video.playAddr[0];
                } else if (!videoSD && Array.isArray(res3?.video)) {
                    videoSD = res3.video[0];
                } else if (!videoSD && typeof res3?.video === 'string') {
                    videoSD = res3.video;
                }

                let watermarkUrl = res3?.videoWatermark || '';
                if (!watermarkUrl && res1?.video?.downloadAddr && res1.video.downloadAddr.length > 0) {
                    watermarkUrl = res1.video.downloadAddr[0];
                }

                // Find cover image
                let coverUrl = res3?.cover || res1?.video?.cover?.[0] || '';
                if (!coverUrl && res3?.images?.length > 0) coverUrl = res3.images[0];
                if (!coverUrl && res1?.images?.length > 0) coverUrl = res1.images[0];

                const musicObj = res1?.music || res3?.music;

                const responseData: DownloaderResponse = {
                    type: isImage ? 'image' : 'video',
                    title: res3?.description || res3?.desc || res1?.desc || 'TikTok Media',
                    cover: coverUrl,
                    author: {
                        nickname: res3?.author?.nickname || res1?.author?.nickname || 'TikTok User',
                        avatar: res3?.author?.avatar || res1?.author?.avatar || '',
                    },
                };

                if (musicObj && (musicObj.playUrl || musicObj.url)) {
                    const mPlayUrl = musicObj.playUrl || musicObj.url;
                    responseData.music = {
                        title: musicObj.title || 'Original Sound',
                        playUrl: Array.isArray(mPlayUrl) ? mPlayUrl[0] : (typeof mPlayUrl === 'string' ? mPlayUrl : ''),
                    };
                }

                if (isImage) {
                    responseData.images = res3?.images || res1?.images || [];
                } else if (videoSD || videoHD) {
                    responseData.video = {
                        hd: videoHD,
                        sd: videoSD,
                        watermark: watermarkUrl,
                    };
                }

                // If we didn't get any valid media, force fail to trigger fallback
                if (!isImage && !responseData.video?.sd && !responseData.video?.hd) {
                    throw new Error('Strategy 1 returned success but missing playable media payload');
                }

                return NextResponse.json({ status: 'success', data: responseData });
            }
        } catch (e) {
            console.warn('Strategy 1 failed:', e);
        }

        // ==========================================
        // STRATEGY 2: tiktok-scraper-without-watermark
        // ==========================================
        try {
            console.log('Attempting Strategy 2: tiktok-scraper-without-watermark');
            const result2 = await tiktokScraper.tiktokdownload(url);

            if (result2 && result2.nowm) {
                const responseData: DownloaderResponse = {
                    type: 'video', // Assume video as scraper primarily does video
                    title: 'TikTok Video',
                    cover: result2.cover || '',
                    author: {
                        nickname: result2.author_name || 'TikTok User',
                        avatar: '',
                    },
                    video: {
                        sd: result2.nowm,
                        watermark: result2.wm,
                    },
                    music: result2.music ? {
                        title: 'Original Audio',
                        playUrl: result2.music
                    } : undefined
                };

                // If we didn't get any valid media, force fail to trigger fallback
                if (!responseData.video?.sd && !responseData.video?.hd) {
                    throw new Error('Strategy 2 returned success but missing media payload');
                }

                return NextResponse.json({ status: 'success', data: responseData });
            }
        } catch (e) {
            console.warn('Strategy 2 failed:', e);
        }

        // ==========================================
        // STRATEGY 3: TikWM Public API Fallback
        // ==========================================
        try {
            console.log('Attempting Strategy 3: TikWM Public API Fallback');
            const fetchRes = await fetch('https://www.tikwm.com/api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                body: new URLSearchParams({ url: url, count: '12', cursor: '0', web: '1', hd: '1' })
            });

            const jsonRes = await fetchRes.json();

            if (jsonRes.code === 0 && jsonRes.data) {
                const data = jsonRes.data;
                const isImage = data.images && data.images.length > 0;

                const responseData: DownloaderResponse = {
                    type: isImage ? 'image' : 'video',
                    title: data.title || 'TikTok Media',
                    cover: data.cover || '',
                    author: {
                        nickname: data.author?.nickname || 'TikTok User',
                        avatar: data.author?.avatar || '',
                    },
                    music: data.music ? {
                        title: 'TikTok Audio',
                        playUrl: data.music
                    } : undefined
                };

                if (isImage) {
                    responseData.images = data.images;
                    responseData.cover = data.images[0];
                } else {
                    responseData.video = {
                        sd: data.play,
                        hd: data.hdplay,
                        watermark: data.wmplay,
                    }
                }

                // If we didn't get any valid media, force fail
                if (!isImage && !responseData.video?.sd && !responseData.video?.hd) {
                    throw new Error('Strategy 3 returned success but missing media payload');
                }

                return NextResponse.json({ status: 'success', data: responseData });
            }
        } catch (e) {
            console.warn('Strategy 3 failed:', e);
        }

        // If all strategies fail
        return NextResponse.json(
            { status: 'error', message: 'Gagal mengunduh video. Pastikan link video TikTok tersebut benar, video bersifat publik (tidak diprivat), dan belum dihapus.' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Unhandled Downloader API Error:', error);
        return NextResponse.json({ status: 'error', message: 'Terjadi kesalahan pada server saat mencoba mengunduh. Silakan coba lagi nanti.' }, { status: 500 });
    }
}
