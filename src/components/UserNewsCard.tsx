import type { UiNews } from '../types/news';
import type { ScrapManager } from '../hooks/useScrapManager';
import { formatDateTime } from '../utils/news';
import ScrapActionButtons from './ScrapActionButtons';
import './UserNewsCard.css';
import DefaultThumbnail from '../pages/Nuzip_logo2.png';

type UserNewsCardProps = {
  item: UiNews;
  scrapManager: ScrapManager;
};

const parseKeywords = (keywordString?: string) =>
  (keywordString ?? '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

const renderSentiment = (sentiment?: string) => {
  switch (sentiment) {
    case '긍정':
      return <span className="sentiment positive">긍정</span>;
    case '부정':
      return <span className="sentiment negative">부정</span>;
    default:
      return <span className="sentiment neutral">중립</span>;
  }
};

export default function UserNewsCard({ item, scrapManager }: UserNewsCardProps) {
  const keywords = parseKeywords(item.keywords);
  const link = (item.originalLink as string) || (item.url as string) || '#';
  const thumbnail = item.imageUrl || DefaultThumbnail;

  return (
    <div className="user-news-card">
      <img src={thumbnail} alt={item.title ?? '뉴스 이미지'} className="user-news-thumbnail" />
      <div className="user-news-content">
        <a href={link} target="_blank" rel="noopener noreferrer" className="news-title-link">
          <h2 className="news-title">{item.title || '제목 없음'}</h2>
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

        {item.summary && <p className="user-news-summary">{item.summary}</p>}

        <div className="news-footer">
          <span className="user-news-date">{formatDateTime(item.publishedAt)}</span>
          {renderSentiment(item.sentiment)}
        </div>
        <ScrapActionButtons article={item} manager={scrapManager} showRating={false} />
      </div>
    </div>
  );
}

