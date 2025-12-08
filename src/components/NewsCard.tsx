import type { UiNews } from '../types/news';
import type { ScrapManager } from '../hooks/useScrapManager';
import { decodeHtmlEntities, formatDateTime, shouldDisplayNews } from '../utils/news';
import ScrapActionButtons from './ScrapActionButtons';
import './components.css';
import DefaultThumbnail from '../pages/Nuzip_logo.png';

type NewsCardProps = {
  item: UiNews;
  scrapManager?: ScrapManager;
};

const parseKeywords = (keywordString?: string) =>
  decodeHtmlEntities(keywordString)
    .split(',')
    .map((keyword) => decodeHtmlEntities(keyword).trim())
    .filter(Boolean);

export default function NewsCard({ item, scrapManager }: NewsCardProps) {
  if (!shouldDisplayNews(item)) return null;

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
