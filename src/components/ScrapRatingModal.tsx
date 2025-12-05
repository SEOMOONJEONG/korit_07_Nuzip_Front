import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import type { ScrapManager } from '../hooks/useScrapManager';
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
          <h4>{ratingModal.scrap.title}</h4>
          <p>{ratingModal.scrap.summary || '요약이 없습니다.'}</p>
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

