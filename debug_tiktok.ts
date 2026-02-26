import TiktokDL from '@tobyg74/tiktok-api-dl';

async function test(url: string) {
    console.log("Testing URL:", url);

    for (const v of ['v1', 'v2'] as const) {
        console.log(`\n--- Strategy 1 (${v}) ---`);
        try {
            const res1 = await TiktokDL.Downloader(url, { version: v });
            console.log(`Strat 1 (${v}) success?`, res1.status === 'success');
            if (res1.result) {
                const videoData = (res1.result as any).video;
                if (videoData) {
                    console.log("Video keys:", Object.keys(videoData));
                    if (v === 'v1') {
                        console.log("v1 playAddr:", videoData.playAddr);
                        console.log("v1 downloadAddr:", videoData.downloadAddr);
                    }
                    if (v === 'v2') {
                        console.log("v2 playAddr:", videoData.playAddr);
                        console.log("v2 downloadAddr:", videoData.downloadAddr);
                    }
                }
            }
        } catch (e) {
            console.error(`Strat 1 (${v}) Error`, e);
        }
    }
}

test('https://www.tiktok.com/@tiktok/video/7106594312292453675');
