import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarRateIcon from '@mui/icons-material/StarRate';
import type { UiNews } from '../types/news';
import type { ScrapManager } from '../hooks/useScrapManager';
import { getArticleKey } from '../utils/scrap';
import './ScrapActions.css';

type ScrapActionButtonsProps = {
  article: UiNews;
  manager: ScrapManager;
  showRating?: boolean;
};

export default function ScrapActionButtons({
  article,
  manager,
  showRating = true,
}: ScrapActionButtonsProps) {
  const articleKey = getArticleKey(article);
  if (!articleKey) return null;

  const scrappedFromArticle = Boolean(article.isScrapped);
  const scrappedFromManager = Boolean(manager.scrapMap[articleKey]);
  const scrapped = scrappedFromArticle || scrappedFromManager;
  const busy = Boolean(manager.busyMap[articleKey]);
  const ratingActive =
    manager.ratingModal.open &&
    manager.ratingModal.article &&
    getArticleKey(manager.ratingModal.article) === articleKey;
  const ratingButtonClass = ['icon-button', 'rating-button', ratingActive ? 'rating-button--active' : '']
    .filter(Boolean)
    .join(' ');
  const canRate = scrapped;

  return (
    <div className="scrap-action-buttons">
      <button
        type="button"
        className={`icon-button ${scrapped ? 'icon-button--active' : ''}`}
        onClick={() => manager.toggleScrap(article)}
        disabled={busy}
        title={scrapped ? '즐겨찾기 취소' : '즐겨찾기 추가'}
      >
        {scrapped ? (
          <BookmarkIcon className="icon-filled" fontSize="small" />
        ) : (
          <BookmarkBorderIcon className="icon-border" fontSize="small" />
        )}
        <span className="visually-hidden">즐겨찾기</span>
      </button>

      {showRating && (
        <button
          type="button"
          className={ratingButtonClass}
          onClick={() => manager.openRating(article)}
          title={canRate ? '별점 남기기' : '먼저 스크랩을 해주세요'}
          disabled={!canRate}
        >
          <StarBorderIcon className="rating-icon rating-icon--outline" fontSize="small" />
          <StarRateIcon className="rating-icon rating-icon--filled" fontSize="small" />
          <span className="visually-hidden">별점 남기기</span>
        </button>
      )}
    </div>
  );
}

