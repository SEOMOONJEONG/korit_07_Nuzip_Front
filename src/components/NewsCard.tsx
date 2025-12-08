import type { UiNews } from '../types/news';
import type { ScrapManager } from '../hooks/useScrapManager';
import { decodeHtmlEntities, formatDateTime } from '../utils/news';
import ScrapActionButtons from './ScrapActionButtons';
import './components.css';
import DefaultThumbnail from '../pages/Nuzip_logo.png';

type NewsCardProps = {
  item: UiNews;
  scrapManager?: ScrapManager;
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

const normalize = (value?: string) =>
  (value ?? '')
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/ㆍ/g, '')
    .replace(/[.#\[\]]/g, '');

const isAnalysisSuccessful = (newsItem: UiNews) => {
  const summary = newsItem.summary ?? '';
  if (summary.trim().length < 5) return false;

  const normalizedSummary = normalize(summary);
  const normalizedKeywords = normalize(newsItem.keywords);
  return !FAILURE_INDICATORS.some((indicator) => {
    const key = normalize(indicator);
    return normalizedSummary.includes(key) || normalizedKeywords.includes(key);
  });
};

const parseKeywords = (keywordString?: string) =>
  decodeHtmlEntities(keywordString)
    .split(',')
    .map((keyword) => decodeHtmlEntities(keyword).trim())
    .filter(Boolean);

export default function NewsCard({ item, scrapManager }: NewsCardProps) {
  if (!isAnalysisSuccessful(item)) return null;

  const keywords = parseKeywords(item.keywords);
  const link = (item.originalLink as string) || (item.url as string) || '#';
  const thumbnail = item.imageUrl || DefaultThumbnail;
  const decodedTitle = decodeHtmlEntities(item.title) || '제목 없음';
  const decodedSummary = decodeHtmlEntities(item.summary);
  const hasSummary = decodedSummary.trim().length > 0;

  return (
    <div className="news-card">
      <img src={thumbnail} alt={item.title ?? '썸네일'} className="news-thumbnail" loading="lazy" />
      <div className="news-content">
        <a href={link} target="_blank" rel="noopener noreferrer" className="news-title-link">
          <h2 className="news-title">{decodedTitle}</h2>
        </a>

        {keywords.length > 0 && (
          <div className="news-keywords">
            {keywords.map((keyword, idx) => (
              <span key={`${keyword}-${idx}`} className="keyword">
                #{keyword}
              </span>
            ))}
          </div>
        )}

        {hasSummary && <p className="news-summary">{decodedSummary}</p>}
        <div className="news-footer">
          <span className="news-date">{formatDateTime(item.publishedAt)}</span>
          {scrapManager && (
            <ScrapActionButtons article={item} manager={scrapManager} showRating={false} />
          )}
        </div>
      </div>
    </div>
  );
}

