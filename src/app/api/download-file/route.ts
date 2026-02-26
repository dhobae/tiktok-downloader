import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'download_media';

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
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

        // Only pass necessary headers to prevent decompression/length mismatches
        const headers = new Headers();
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);

        const contentType = response.headers.get('content-type');
        if (contentType) {
            headers.set('Content-Type', contentType);
        } else {
            headers.set('Content-Type', 'application/octet-stream');
        }

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });
    } catch (err: any) {
        console.error('Download proxy error:', err);
        return NextResponse.json({ error: 'Failed to download media' }, { status: 500 });
    }
}
