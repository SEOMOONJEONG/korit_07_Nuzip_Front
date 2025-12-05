import type { UiNews } from '../types/news';
import type { ScrapDto } from '../api/nuzipclientapi';

const SCRAP_IMAGE_CACHE_KEY = 'nuzip_scrap_image_cache';

const hasWindow = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

let scrapImageCache: Record<string, string> | null = null;

const readImageCache = () => {
  if (!hasWindow()) return {};
  if (scrapImageCache) return scrapImageCache;
  try {
    const raw = window.localStorage.getItem(SCRAP_IMAGE_CACHE_KEY);
    scrapImageCache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    scrapImageCache = {};
  }
  return scrapImageCache!;
};

const writeImageCache = () => {
  if (!hasWindow() || !scrapImageCache) return;
  try {
    window.localStorage.setItem(SCRAP_IMAGE_CACHE_KEY, JSON.stringify(scrapImageCache));
  } catch {
    // Ignore write errors (e.g., storage quota)
  }
};

export const cacheScrapImage = (url?: string | null, imageUrl?: string | null) => {
  if (!url || !imageUrl) return;
  const cache = readImageCache();
  if (cache[url] === imageUrl) return;
  cache[url] = imageUrl;
  scrapImageCache = cache;
  writeImageCache();
};

export const getCachedScrapImage = (url?: string | null) => {
  if (!url) return '';
  const cache = readImageCache();
  return cache[url] ?? '';
};

export const getArticleKey = (article?: Partial<UiNews>) => {
  if (!article) return '';
  if (article.originalLink) return article.originalLink;
  if (article.url) return article.url as string;
  if (article.id !== undefined && article.id !== null) return `id-${article.id}`;
  if (article.title) return article.title;
  return '';
};

export const getScrapKey = (scrap?: ScrapDto) => {
  if (!scrap) return '';
  if (scrap.url) return scrap.url;
  return `scrap-${scrap.id}`;
};

export const getArticleKeyFromScrap = (scrap?: ScrapDto) => {
  if (!scrap) return '';
  if (scrap.url) return scrap.url;
  if (scrap.id !== undefined && scrap.id !== null) return `id-${scrap.id}`;
  if (scrap.title) return scrap.title;
  return '';
};

export const buildScrapPayload = (article: UiNews) => ({
  title: article.title || '제목 없음',
  url: (article.originalLink as string) || (article.url as string) || '',
  summary: article.summary || article.keywords || '요약 정보가 없습니다.',
  imageUrl: article.imageUrl,
});

export const withCachedScrapImage = (scrap: ScrapDto, fallback?: string) => {
  if (!scrap) return scrap;
  const url = scrap.url;
  if (scrap.imageUrl) {
    cacheScrapImage(url, scrap.imageUrl);
    return scrap;
  }
  const resolved = fallback || getCachedScrapImage(url);
  if (!resolved) return scrap;
  cacheScrapImage(url, resolved);
  return {
    ...scrap,
    imageUrl: resolved,
  };
};

