import type { NewsArticle } from '../api/nuzipclientapi';

export type SentimentLabel = '긍정' | '중립' | '부정';

export type UiNews = NewsArticle & {
  publishedAt?: string | number | Date | number[];
  keywords?: string;
  summary?: string;
  sentiment?: SentimentLabel;
  imageUrl?: string;
  thumbnail?: string;
  urlToImage?: string;
  isScrapped?: boolean;
  scrapId?: number;
};

export type CategoryKey =
  | 'ALL'
  | 'POLITICS'
  | 'ECONOMY'
  | 'SOCIETY'
  | 'LIFE_CULTURE'
  | 'IT_SCIENCE'
  | 'WORLD'
  | 'ENTERTAINMENT'
  | 'SPORTS';

export type CategoryOption = {
  key: CategoryKey;
  label: string;
};

export const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'ALL', label: '전체' },
  { key: 'POLITICS', label: '정치' },
  { key: 'ECONOMY', label: '경제' },
  { key: 'SOCIETY', label: '사회' },
  { key: 'LIFE_CULTURE', label: '생활ㆍ문화' },
  { key: 'IT_SCIENCE', label: 'ITㆍ과학' },
  { key: 'WORLD', label: '세계' },
  { key: 'ENTERTAINMENT', label: '엔터' },
  { key: 'SPORTS', label: '스포츠' },
];

const CATEGORY_KEY_SET = new Set<CategoryKey>(
  DEFAULT_CATEGORY_OPTIONS.map((option) => option.key)
);

const STRIP_REGEX = /[\s.\-_/·ㆍ]/g;

const labelToKeyMap = new Map(
  DEFAULT_CATEGORY_OPTIONS.map((option) => [
    option.label.replace(STRIP_REGEX, '').toLowerCase(),
    option.key,
  ])
);

const keyLabelMap = new Map(
  DEFAULT_CATEGORY_OPTIONS.map((option) => [option.key, option.label])
);

const aliasMap = new Map<string, CategoryKey>([
  ['LIFE', 'LIFE_CULTURE'],
  ['LIFECULTURE', 'LIFE_CULTURE'],
  ['CULTURE', 'LIFE_CULTURE'],
  ['ITSCIENCE', 'IT_SCIENCE'],
  ['IT', 'IT_SCIENCE'],
  ['SCIENCE', 'IT_SCIENCE'],
  ['ENT', 'ENTERTAINMENT'],
  ['ENTERTAIN', 'ENTERTAINMENT'],
]);

const normalizeToken = (value?: string | null) =>
  (value ?? '').trim().replace(STRIP_REGEX, '').toLowerCase();

export const isCategoryKey = (key: string): key is CategoryKey =>
  CATEGORY_KEY_SET.has(key as CategoryKey);

export const toCategoryKey = (value?: string | null): CategoryKey | 'UNKNOWN' => {
  if (!value) return 'UNKNOWN';

  const raw = value.trim();
  const upper = raw.toUpperCase();
  if (isCategoryKey(upper)) return upper;

  if (aliasMap.has(upper)) {
    return aliasMap.get(upper)!;
  }

  const normalized = normalizeToken(raw);
  if (labelToKeyMap.has(normalized)) {
    return labelToKeyMap.get(normalized)!;
  }

  const keyFromAlias = aliasMap.get(normalized.toUpperCase());
  if (keyFromAlias) return keyFromAlias;

  return 'UNKNOWN';
};

export const toCategoryLabel = (value?: string | null): string => {
  if (!value) return '기타';
  if (keyLabelMap.has(value as CategoryKey)) {
    return keyLabelMap.get(value as CategoryKey)!;
  }
  const normalized = toCategoryKey(value);
  if (normalized !== 'UNKNOWN') {
    return keyLabelMap.get(normalized) ?? value;
  }
  return value;
};

export const buildUserCategoryOptions = (keys: CategoryKey[]): CategoryOption[] => [
  DEFAULT_CATEGORY_OPTIONS[0],
  ...keys.map((key) => ({
    key,
    label: toCategoryLabel(key),
  })),
];

