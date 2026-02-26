import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || 'download_media';

    if (!rawUrl) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // ✅ Fix: jika URL relatif, tambahkan base URL TikTok
    const url = rawUrl.startsWith('http') ? rawUrl : `https://www.tiktok.com${rawUrl}`;

    // ✅ Validasi URL
    try {
        new URL(url);
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.tiktok.com/',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch media: ${response.statusText}`);
        }

        const headers = new Headers();
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');

        return new NextResponse(response.body, { status: 200, headers });
    } catch (err: any) {
        console.error('Download proxy error:', err);
        return NextResponse.json({ error: err.message || 'Failed to download media' }, { status: 500 });
    }
}