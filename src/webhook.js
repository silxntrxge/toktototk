const express = require('express');
const { TikTokScraper } = require('./index');

const app = express();
app.use(express.json());

const scraper = new TikTokScraper({
    // ... your existing options ...
});

app.post('/scrape', async (req, res) => {
    try {
        const { action, url, musicId, count, username, hashtag } = req.body;
        let result;

        switch (action) {
            case 'scrape_video':
                result = await scraper.scrape('scrape_video', { url });
                break;
            case 'scrape_music':
                result = await scraper.scrape('scrape_music', { musicId, count });
                break;
            case 'trend':
                result = await scraper.scrape();
                break;
            case 'user':
                result = await scraper.scrape('user', { username, count });
                break;
            case 'hashtag':
                result = await scraper.scrape('hashtag', { hashtag, count });
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//hello
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));