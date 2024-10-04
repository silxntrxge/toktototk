#!/usr/bin/env node

console.log('Starting application...');

import express from 'express';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import TikTokScraper from '../build/tiktok-scraper.js';
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { version } = require('../package.json');
import { getRandomUserAgent } from '../build/constant.js';
import { fileURLToPath } from 'url';

function log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (data) {
        const dataString = JSON.stringify(data, null, 2);
        console.log(dataString);
    }
}

const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <command> [options]')
    .command('scrape', 'Scrape TikTok', (yargs) => {
        return yargs
            .option('type', {
                describe: 'Type of scrape',
                type: 'string',
                choices: ['user', 'hashtag', 'trend'],
                demandOption: true
            })
            .option('input', {
                describe: 'Input for scraping (username, hashtag, or trend)',
                type: 'string',
                demandOption: true
            })
            .option('count', {
                describe: 'Number of items to scrape',
                type: 'number',
                default: 10
            });
    })
    .command('trend', 'Scrape Trending TikToks', (yargs) => {
        return yargs
            .option('count', {
                describe: 'Number of trending items to scrape',
                type: 'number',
                default: 10
            })
            .option('download', {
                describe: 'Download the scraped items',
                type: 'boolean',
                default: false
            });
    })
    .help()
    .alias('help', 'h')
    .version(version)
    .parse();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const scraperInstance = new TikTokScraper();

// Define routes for Express
app.post('/scrape', async (req, res) => {
    try {
        const { type, input, count } = req.body;
        log('Received scrape request:', { type, input, count });

        if (!type) {
            log('Error: Scrape type is missing');
            return res.status(400).json({ error: 'Scrape type is required. Please provide a "type" in your request body.' });
        }

        if (!['user', 'hashtag', 'trend'].includes(type)) {
            log(`Error: Invalid scrape type: ${type}`);
            return res.status(400).json({ error: 'Invalid scrape type. Allowed types are: user, hashtag, trend.' });
        }

        if (!input && type !== 'trend') {
            log('Error: Input is missing for non-trend scrape type');
            return res.status(400).json({ error: 'Input is required for user and hashtag scrape types.' });
        }

        const params = {
            type,
            input: input || '',
            count: count || 10,
            download: false,
            filepath: '',
            filetype: '',
            proxy: '',
            asyncDownload: 5,
            asyncScraping: 3,
            cli: false,
            event: false,
            progress: false,
            headers: {
                'user-agent': getRandomUserAgent(),
            },
        };
        log('Initializing scraper with params:', params);
        const result = await scraperInstance.scrape(params);
        
        if (result && result.length > 0) {
            log(`Successfully scraped ${result.length} items.`);
            res.json({ success: true, data: result });
        } else {
            log('No items scraped.');
            res.json({ success: false, message: 'No items scraped' });
        }
    } catch (error) {
        log('Error during scraping:', error);
        res.status(500).json({ error: error.message || 'An error occurred during scraping' });
    }
});

// Function to start scraping via CLI
async function startScraper() {
    log('CLI: Starting scraper with args:', argv);
    try {
        let params = {
            download: false,
            filepath: '',
            filetype: '',
            proxy: '',
            asyncDownload: 5,
            asyncScraping: 3,
            cli: true,
            event: false,
            progress: false,
            headers: {
                'user-agent': getRandomUserAgent(),
            },
            logger: {
                log: (message, ...args) => log(`Scraper: ${message}`, ...args),
                error: (message, ...args) => log(`Scraper Error: ${message}`, ...args),
            },
        };

        if (argv._.includes('scrape')) {
            params = {
                ...params,
                type: argv.type,
                input: argv.input,
                count: argv.count,
            };
            log('CLI: Scraping with params:', params);

            log('CLI: Initializing scraper...');
            const scraper = new TikTokScraper(params);
            log('CLI: Scraper initialized. Starting scrape...');

            try {
                log('CLI: Calling scrape method...');
                const result = await scraper.scrape();
                log('CLI: Scrape method completed. Analyzing results...');

                if (result && result.collector && result.collector.length > 0) {
                    log(`CLI: Successfully scraped ${result.collector.length} items.`);
                    log('CLI: First few scraped items:', result.collector.slice(0, 3));
                    console.log(JSON.stringify({ success: true, data: result }));
                } else {
                    log('CLI: No items scraped. Scraper result:', result);
                    console.log(JSON.stringify({ success: false, message: 'No items scraped', data: result }));
                }
            } catch (scrapeError) {
                log('CLI: Error occurred during scraping:', scrapeError);
                log('CLI: Error stack trace:', scrapeError.stack);
                if (scrapeError.response) {
                    log('CLI: Error response data:', scrapeError.response.data);
                }
                console.log(JSON.stringify({ success: false, error: scrapeError.message }));
            }
        } else {
            log('CLI: Invalid command. Use --help to see available commands.');
            console.log(JSON.stringify({ success: false, error: 'Invalid command' }));
            process.exit(1);
        }
    } catch (error) {
        log('CLI: Unexpected error during scraping:', error);
        log('CLI: Error stack trace:', error.stack);
        if (error.response) {
            log('CLI: Error response data:', error.response.data);
        }
        console.log(JSON.stringify({ success: false, error: error.message }));
    }
}

// Determine if the script is being run directly or imported
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    log('CLI script running directly');
    log('Starting CLI scraper mode');
    // Run the CLI scraper for other commands
    startScraper().then(() => {
        log('CLI scraper finished, exiting');
        process.exit(0);
    });
} else {
    // Start the Express server if imported
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}

export default app;