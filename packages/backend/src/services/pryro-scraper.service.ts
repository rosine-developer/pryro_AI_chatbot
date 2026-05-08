import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';

interface ScrapedPage {
  url: string;
  text: string;
  fetchedAt: Date;
}

// In-memory cache: page url -> scraped content (TTL 30 min)
const pageCache = new Map<string, ScrapedPage>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const PRYRO_PAGES = [
  'https://pryro.com',
  'https://pryro.com/about',
  'https://pryro.com/pricing',
  'https://pryro.com/contact',
];

/**
 * Scrape a single page and return clean text
 */
async function scrapePage(url: string): Promise<string> {
  // Return from cache if still fresh
  const cached = pageCache.get(url);
  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
    return cached.text;
  }

  try {
    const { data } = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PryroBot/1.0)',
      },
    });

    const $ = cheerio.load(data);

    // Remove noise
    $('script, style, noscript, nav, footer, head, iframe, img, svg').remove();

    // Get clean text
    const text = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .slice(0, 3000); // cap per page

    pageCache.set(url, { url, text, fetchedAt: new Date() });
    return text;
  } catch (error: any) {
    logger.warn(`Failed to scrape ${url}`, { error: error.message });
    return '';
  }
}

/**
 * Fetch all Pryro pages and return combined live content
 */
export async function fetchPryroLiveContent(): Promise<string> {
  const results = await Promise.allSettled(PRYRO_PAGES.map(scrapePage));

  const sections = results
    .map((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        return `--- ${PRYRO_PAGES[i]} ---\n${r.value}`;
      }
      return '';
    })
    .filter(Boolean);

  if (sections.length === 0) {
    logger.warn('All Pryro page scrapes failed — using knowledge base only');
    return '';
  }

  return sections.join('\n\n');
}

/**
 * Fetch only the most relevant page based on the user's question.
 * Always includes contact page so address/phone are never missing.
 */
export async function fetchRelevantPryroPage(question: string): Promise<string> {
  const q = question.toLowerCase();

  // Always fetch contact page — short follow-ups like "where exactly?" need it
  const pagesToFetch = new Set<string>(['https://pryro.com/contact']);

  if (q.includes('price') || q.includes('cost') || q.includes('plan') || q.includes('free') || q.includes('paid') || q.includes('subscription')) {
    pagesToFetch.add('https://pryro.com/pricing');
  } else if (q.includes('about') || q.includes('founder') || q.includes('team') || q.includes('history') || q.includes('who started') || q.includes('who made')) {
    pagesToFetch.add('https://pryro.com/about');
  } else {
    pagesToFetch.add('https://pryro.com');
  }

  const results = await Promise.allSettled([...pagesToFetch].map(scrapePage));
  const combined = results
    .map((r) => (r.status === 'fulfilled' ? r.value : ''))
    .filter(Boolean)
    .join('\n\n');

  return combined;
}
