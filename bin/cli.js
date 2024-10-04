#!/usr/bin/env node

import express from 'express';
import axios from 'axios';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

async function scrapeTikTokProfile(username) {
    const url = `https://www.tiktok.com/@${username}`;
    const response = await axios.get(url, { headers });
    const html = response.data;
    const scriptContent = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/s)[1];
    const jsonData = JSON.parse(scriptContent);
    return jsonData.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo;
}

async function scrapeTikTokPosts(username) {
    const url = `https://www.tiktok.com/api/post/item_list/?aid=1988&secUid=MS4wLjABAAAAv7iJGEqcd0pjU-xTwpzA5oOiuDgXoZo4vGx3tTcgLtDLIUqWDT8pWM4yHYHiJ1wD&count=30&cursor=0`;
    const response = await axios.get(url, { headers });
    return response.data.itemList.map(post => ({
        createTime: post.createTime,
        desc: post.desc,
        id: post.id,
        stats: post.stats,
        video: post.video
    }));
}

async function scrapeTikTokHashtag(hashtag) {
    const url = `https://www.tiktok.com/api/challenge/item_list/?aid=1988&challengeID=${hashtag}&count=30&cursor=0`;
    const response = await axios.get(url, { headers });
    return response.data.itemList.map(post => ({
        createTime: post.createTime,
        desc: post.desc,
        id: post.id,
        stats: post.stats,
        video: post.video
    }));
}

async function scrapeTikTokTrending() {
    const url = 'https://www.tiktok.com/api/recommend/item_list/?aid=1988&count=30&cursor=0';
    const response = await axios.get(url, { headers });
    return response.data.itemList.map(post => ({
        createTime: post.createTime,
        desc: post.desc,
        id: post.id,
        stats: post.stats,
        video: post.video
    }));
}

async function scrapeTikTokMusic(musicId) {
    const url = `https://www.tiktok.com/api/music/item_list/?aid=1988&musicID=${musicId}&count=30&cursor=0`;
    const response = await axios.get(url, { headers });
    return response.data.itemList.map(post => ({
        createTime: post.createTime,
        desc: post.desc,
        id: post.id,
        stats: post.stats,
        video: post.video
    }));
}

app.post('/scrape', async (req, res) => {
    try {
        const { type, input } = req.body;
        let result;

        switch (type) {
            case 'user':
                const profileData = await scrapeTikTokProfile(input);
                const postsData = await scrapeTikTokPosts(input);
                result = { profile: profileData, posts: postsData };
                break;
            case 'hashtag':
                result = await scrapeTikTokHashtag(input);
                break;
            case 'trending':
                result = await scrapeTikTokTrending();
                break;
            case 'music':
                result = await scrapeTikTokMusic(input);
                break;
            default:
                return res.status(400).json({ error: 'Invalid scrape type' });
        }

        res.json(result);
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).json({ error: error.message || 'An error occurred during scraping' });
    }
});

const argv = yargs(hideBin(process.argv))
    .command('scrape <type> [input]', 'Scrape TikTok data', (yargs) => {
        yargs
            .positional('type', {
                describe: 'Type of data to scrape',
                choices: ['user', 'hashtag', 'trending', 'music']
            })
            .positional('input', {
                describe: 'Input for scraping (username, hashtag, or music ID)',
                type: 'string'
            })
    })
    .help()
    .argv;

if (require.main === module) {
    if (argv._.includes('scrape')) {
        const { type, input } = argv;
        let scrapeFunction;

        switch (type) {
            case 'user':
                scrapeFunction = async () => {
                    const profileData = await scrapeTikTokProfile(input);
                    const postsData = await scrapeTikTokPosts(input);
                    return { profile: profileData, posts: postsData };
                };
                break;
            case 'hashtag':
                scrapeFunction = () => scrapeTikTokHashtag(input);
                break;
            case 'trending':
                scrapeFunction = scrapeTikTokTrending;
                break;
            case 'music':
                scrapeFunction = () => scrapeTikTokMusic(input);
                break;
            default:
                console.error('Invalid scrape type');
                process.exit(1);
        }

        scrapeFunction()
            .then(result => console.log(JSON.stringify(result, null, 2)))
            .catch(console.error)
            .finally(() => process.exit(0));
    } else {
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    }
}

export default app;