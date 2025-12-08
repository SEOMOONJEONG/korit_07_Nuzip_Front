import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import type { ScrapManager } from '../hooks/useScrapManager';
import { decodeHtmlEntities } from '../utils/news';
import './ScrapActions.css';

type ScrapRatingModalProps = {
  manager: ScrapManager;
};

export default function ScrapRatingModal({ manager }: ScrapRatingModalProps) {
  const {
    ratingModal,
    closeRating,
    ratingValue,
    setRatingValue,
    ratingFeedback,
    setRatingFeedback,
    submitRating,
    ratingBusy,
  } = manager;

  if (!ratingModal.open || !ratingModal.scrap) return null;

  const decodedTitle = (() => {
    const text = decodeHtmlEntities(ratingModal.scrap.title).trim();
    return text.length > 0 ? text : '제목 없음';
  })();
  const decodedSummary = decodeHtmlEntities(ratingModal.scrap.summary).trim();

  return (
    <div className="rating-modal" role="dialog" aria-modal="true">
      <div className="rating-modal__backdrop" onClick={closeRating} />
      <form
        className="rating-modal__dialog"
        onSubmit={(event) => {
          event.preventDefault();
          submitRating();
        }}
      >
        <div className="rating-modal__header">
          <h4>{decodedTitle}</h4>
          <p>{decodedSummary || '요약이 없습니다.'}</p>
        </div>

        <div className="rating-modal__body">
          <div className="rating-modal__stars">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= ratingValue;
              return (
                <button
                  key={value}
                  type="button"
                  className={`star-button ${active ? 'star-button--active' : ''}`}
                  onClick={() => setRatingValue(value)}
                  aria-label={`${value}점 선택`}
                >
                  {active ? <StarIcon fontSize="inherit" /> : <StarBorderIcon fontSize="inherit" />}
                </button>
              );
            })}
            <span className="rating-modal__score">{ratingValue || 0}/5</span>
          </div>

          <textarea
            rows={4}
            placeholder="AI 요약에 대한 의견을 입력해 주세요."
            value={ratingFeedback}
            onChange={(event) => setRatingFeedback(event.target.value)}
          />
        </div>

        <div className="rating-modal__footer">
          <button type="button" onClick={closeRating} disabled={ratingBusy}>
            취소
          </button>
          <button type="submit" disabled={ratingBusy}>
            {ratingBusy ? '전송 중…' : '전송'}
          </button>
        </div>
      </form>
    </div>
  );
}

