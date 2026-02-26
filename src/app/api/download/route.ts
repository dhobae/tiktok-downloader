import { NextResponse } from 'next/server';
import TiktokDL from '@tobyg74/tiktok-api-dl';
const tiktokScraper = require('tiktok-scraper-without-watermark');

// Helper: fix relative URLs
const fixUrl = (u: string): string => {
    if (!u) return '';
    if (u.startsWith('http')) return u;
    return `https://www.tiktok.com${u}`;
};

// Helper: fix array or string URL
const resolveUrl = (val: any): string => {
    if (!val) return '';
    if (Array.isArray(val)) return fixUrl(val[0] || '');
    if (typeof val === 'string') return fixUrl(val);
    return '';
};

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

            console.log('Strategy 1 res3:', JSON.stringify(res3));
            console.log('Strategy 1 res1:', JSON.stringify(res1));

            if (res3 || res1) {
                const isImage = res3?.type === 'image' || res1?.type === 'image'
                    || (res3?.images && res3.images.length > 0)
                    || (res1?.images && res1.images.length > 0);

                const videoHD = resolveUrl(res3?.videoHD);
                let videoSD = resolveUrl(res3?.videoSD);

                if (!videoSD) videoSD = resolveUrl(res1?.video?.playAddr);
                if (!videoSD) videoSD = resolveUrl(res3?.video);

                const watermarkUrl = resolveUrl(res3?.videoWatermark || res1?.video?.downloadAddr);

                let coverUrl = resolveUrl(res3?.cover || res1?.video?.cover);
                if (!coverUrl && res3?.images?.length > 0) coverUrl = fixUrl(res3.images[0]);
                if (!coverUrl && res1?.images?.length > 0) coverUrl = fixUrl(res1.images[0]);

                const musicObj = res1?.music || res3?.music;

                console.log('Strategy 1 resolved - videoHD:', videoHD, 'videoSD:', videoSD);

                const responseData: DownloaderResponse = {
                    type: isImage ? 'image' : 'video',
                    title: res3?.description || res3?.desc || res1?.desc || 'TikTok Media',
                    cover: coverUrl,
                    author: {
                        nickname: res3?.author?.nickname || res1?.author?.nickname || 'TikTok User',
                        avatar: resolveUrl(res3?.author?.avatar || res1?.author?.avatar),
                    },
                };

                if (musicObj) {
                    const mPlayUrl = resolveUrl(musicObj.playUrl || musicObj.url);
                    if (mPlayUrl) {
                        responseData.music = {
                            title: musicObj.title || 'Original Sound',
                            playUrl: mPlayUrl,
                        };
                    }
                }

                if (isImage) {
                    responseData.images = (res3?.images || res1?.images || []).map(fixUrl);
                } else if (videoSD || videoHD) {
                    responseData.video = {
                        hd: videoHD,
                        sd: videoSD,
                        watermark: watermarkUrl,
                    };
                }

                if (!isImage && !responseData.video?.sd && !responseData.video?.hd) {
                    throw new Error('Strategy 1 returned success but missing playable media payload');
                }

                console.log('Strategy 1 succeeded ✅');
                return NextResponse.json({ status: 'success', data: responseData });
            }

            // res3 dan res1 keduanya null
            throw new Error('Strategy 1: both v3 and v1 returned no result');

        } catch (e) {
            console.warn('Strategy 1 failed:', e);
        }

        // Semua strategi gagal
        return NextResponse.json(
            { status: 'error', message: 'Gagal mengunduh video. Pastikan link video TikTok tersebut benar, video bersifat publik (tidak diprivat), dan belum dihapus.' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Unhandled Downloader API Error:', error);
        return NextResponse.json({ status: 'error', message: 'Terjadi kesalahan pada server saat mencoba mengunduh. Silakan coba lagi nanti.' }, { status: 500 });
    }
}