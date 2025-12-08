import type { UiNews } from '../types/news';

const pad = (value: number) => value.toString().padStart(2, '0');

const BASIC_ENTITY_MAP: Record<string, string> = {
  '&quot;': '"',
  '&#34;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
};

const fallbackDecodeEntities = (input: string) =>
  input.replace(/&(quot|#34|#39|apos|amp|lt|gt);/g, (match) => BASIC_ENTITY_MAP[match] ?? match);

let htmlEntityDecoder: HTMLTextAreaElement | null = null;

export const decodeHtmlEntities = (value?: string | null): string => {
  if (!value) return '';
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallbackDecodeEntities(value);
  }
  if (!htmlEntityDecoder) {
    htmlEntityDecoder = document.createElement('textarea');
  }
  htmlEntityDecoder.innerHTML = value;
  return htmlEntityDecoder.value;
};

export const parsePublishedAt = (value?: UiNews['publishedAt']): Date => {
  if (!value) return new Date(0);

  if (Array.isArray(value)) {
    const [year, month = 1, day = 1, hour = 0, minute = 0] = value;
    return new Date(year, month - 1, day, hour, minute);
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (value instanceof Date) {
    return new Date(value);
  }

  const normalized = value.replace(/\./g, '-').replace(/\//g, '-');
  const hasTime = /T|:/i.test(normalized);
  return new Date(hasTime ? normalized : `${normalized}T00:00:00`);
};

export const sortNewsByDate = (items: UiNews[]) =>
  [...items].sort(
    (a, b) => parsePublishedAt(b.publishedAt).getTime() - parsePublishedAt(a.publishedAt).getTime()
  );

export const matchesSearchTerm = (item: UiNews, keyword: string) => {
  const lower = keyword.toLowerCase();
  return (
    (item.title ?? '').toLowerCase().includes(lower) ||
    (item.summary ?? '').toLowerCase().includes(lower) ||
    (item.keywords ?? '').toLowerCase().includes(lower)
  );
};

export const formatDateTime = (value?: UiNews['publishedAt']) => {
  const date = parsePublishedAt(value);
  if (Number.isNaN(date.getTime())) return '날짜 정보 없음';
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}.${month}.${day} ${hour}:${minute}`;
};

