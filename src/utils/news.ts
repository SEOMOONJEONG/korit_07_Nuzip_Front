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

const FAILURE_INDICATORS = [
  '기사 없음',
  '내용 부족',
  '분석 불가',
  '정보 없음',
  '데이터 없음',
  '제공된 기사',
  '요약 불가',
  '분석 실패',
  '기사 내용',
  '이 기사는',
  '이 내용은',
  '제공된 텍스트',
  '기사 본문',
  '제공된 내용은',
  '#오류',
];

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

const normalizeNoise = (value?: string) =>
  (value ?? '')
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/ㆍ/g, '')
    .replace(/[.#\[\]]/g, '');

export const shouldDisplayNews = (newsItem: UiNews) => {
  const summary = newsItem.summary ?? '';
  if (summary.trim().length < 5) return false;
  const normalizedSummary = normalizeNoise(summary);
  const normalizedKeywords = normalizeNoise(newsItem.keywords);
  return !FAILURE_INDICATORS.some((indicator) => {
    const key = normalizeNoise(indicator);
    return normalizedSummary.includes(key) || normalizedKeywords.includes(key);
  });
};

export const filterDisplayableNews = (items: UiNews[]) =>
  items.filter((item) => shouldDisplayNews(item));

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

