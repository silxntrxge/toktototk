declare module 'request' {
    export interface OptionsWithUri {
        uri: string;
        // Add other properties as needed
    }
}

declare class CookieJar {}

// More specific declarations
declare module 'api/tiktokMusic' {}
declare module 'constant/index' {}
declare module 'core/Downloader' {}
declare module 'core/TikTok' {}
declare module 'helpers/Bar' {}

declare module 'tiktok-scraper' {
    export interface TikTokScraperOptions {
        // Define your options here
    }

    export interface TikTokVideoMetadata {
        // Define video metadata properties
    }

    // Add other necessary type declarations
}