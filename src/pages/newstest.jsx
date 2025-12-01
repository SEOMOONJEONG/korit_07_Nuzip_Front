import { useCallback, useEffect, useState } from 'react';
import {
  fetchLatestNews,
  getMyScraps,
  createScrap,
  removeScrap,
} from '../api/nuzipclientapi';
import './newstest.css';

const PAGE_SIZE = 10;

const getArticleKey = (article) => {
  if (!article) return '';
  if (article.originalLink) return article.originalLink;
  if (article.url) return article.url;
  if (article.id !== undefined && article.id !== null) return `id-${article.id}`;
  return article.title || '';
};

const getScrapKey = (scrap) => scrap?.url || `scrap-${scrap?.id}`;

const buildSummary = (article) =>
  article.summary || article.keywords || '요약 정보가 없습니다.';

export default function NewsTestPage() {
  const [articles, setArticles] = useState([]);
  const [scrapMap, setScrapMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyMap, setBusyMap] = useState({});

  const loadScraps = useCallback(async () => {
    try {
      const { data } = await getMyScraps();
      const map = {};
      (Array.isArray(data) ? data : []).forEach((scrap) => {
        const key = getScrapKey(scrap);
        if (key) map[key] = scrap.id;
      });
      setScrapMap(map);
    } catch (err) {
      console.error('스크랩 목록 불러오기 실패', err);
    }
  }, []);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchLatestNews({ page: 0, size: PAGE_SIZE });
      const list = Array.isArray(data) ? data : [];
      const deduped = [];
      const seen = new Set();
      list.forEach((article) => {
        const key = getArticleKey(article);
        if (!key || seen.has(key)) return;
        seen.add(key);
        deduped.push(article);
      });
      setArticles(deduped.slice(0, PAGE_SIZE));
    } catch (err) {
      console.error('뉴스 불러오기 실패', err);
      setArticles([]);
      setError(err.response?.data?.message || '뉴스를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
    loadScraps();
  }, [loadArticles, loadScraps]);

  const handleToggleScrap = async (article) => {
    const key = getArticleKey(article);
    if (!key || busyMap[key]) return;

    setBusyMap((prev) => ({ ...prev, [key]: true }));
    try {
      const scrapId = scrapMap[key];
      if (scrapId) {
        await removeScrap(scrapId);
      } else {
        await createScrap({
          title: article.title,
          url: article.originalLink || article.url || '',
          summary: buildSummary(article),
        });
      }
      await loadScraps();
    } catch (err) {
      console.error('스크랩 토글 실패', err);
      setError(err.response?.data?.message || '스크랩 처리 중 문제가 발생했습니다.');
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <div className="news-test-page">
      <header className="news-test-header">
        <h1>백엔드 뉴스 DB 미리보기</h1>
        <p>
          백엔드 `news_article` 테이블에 저장된 기사(최신 {PAGE_SIZE}개)를 `/api/news`로
          불러와 스크랩 버튼만 확인할 수 있는 테스트 페이지입니다.
        </p>
      </header>

      {error && <div className="news-test-status">{error}</div>}

      {loading ? (
        <div className="news-test-status">뉴스를 불러오는 중입니다…</div>
      ) : articles.length === 0 ? (
        <div className="news-test-status">표시할 기사가 없습니다.</div>
      ) : (
        <div className="news-test-list">
          {articles.map((article, idx) => {
            const key = `${getArticleKey(article)}-${idx}`;
            const scrapped = Boolean(scrapMap[getArticleKey(article)]);
            return (
              <article key={key} className="news-test-card">
                <h3>{article.title}</h3>
                <p>{buildSummary(article)}</p>
                <button
                  type="button"
                  onClick={() => handleToggleScrap(article)}
                  disabled={busyMap[getArticleKey(article)]}
                  className={scrapped ? 'scrapped' : ''}
                >
                  {scrapped ? '★ 즐겨찾기 취소' : '☆ 즐겨찾기'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

