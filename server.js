import express from 'express';
import { createRequire } from 'module';
import axios from 'axios';

const require = createRequire(import.meta.url);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

async function scrapeTikTokPosts(username, count = 30) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
    };

    try {
        // First, fetch the user's secUid
        const userInfoUrl = `https://www.tiktok.com/node/share/user/@${username}`;
        const userInfoResponse = await axios.get(userInfoUrl, { headers });
        const secUid = userInfoResponse.data.userInfo.user.secUid;

        // Now use the secUid to fetch the user's posts
        const postsUrl = `https://www.tiktok.com/api/post/item_list/?aid=1988&secUid=${secUid}&count=${count}&cursor=0`;
        const postsResponse = await axios.get(postsUrl, { headers });

        if (!postsResponse.data.itemList) {
            throw new Error('Unexpected response structure');
        }

        return postsResponse.data.itemList.map(post => ({
            createTime: post.createTime,
            desc: post.desc,
            id: post.id,
            stats: post.stats,
            video: post.video
        }));
    } catch (error) {
        console.error('Error fetching TikTok posts:', error.message);
        throw error;
    }
}

app.post('/scrape', async (req, res) => {
    const { action, hashtag, count = 10 } = req.body;

    console.log(`[${new Date().toISOString()}] Received scrape request: action=${action}, hashtag=${hashtag}, count=${count}`);

    try {
        let result;
        if (action === 'user') {
            result = await scrapeTikTokPosts(hashtag, count);
        } else if (action === 'hashtag') {
            // Implement hashtag scraping logic here
            throw new Error('Hashtag scraping not implemented yet');
        } else {
            throw new Error('Invalid action specified');
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Scraping error:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('TikTok Scraper is running. Send a POST request to /scrape to start scraping.');
});

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});