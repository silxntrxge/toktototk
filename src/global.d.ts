declare module 'got' {
  export default function got(url: string, options?: any): Promise<any>;
}

declare module 'cheerio' {
  export function load(html: string): CheerioStatic;
}