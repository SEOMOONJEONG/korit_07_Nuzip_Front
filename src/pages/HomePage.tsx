import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import NewsTicker from '../components/NewsTicker';
import NewsCard from '../components/NewsCard';
import { fetchLatestNews } from '../api/nuzipclientapi';
import type { UiNews, CategoryKey } from '../types/news';
import { toCategoryKey } from '../types/news';
import { filterDisplayableNews, matchesSearchTerm, shouldDisplayNews, sortNewsByDate } from '../utils/news';
import './HomePage.css';
import '../components/components.css';

const ITEMS_PER_PAGE = 8;

const QUICK_CATEGORY_TAGS = [
  { key: 'ALL', label: '전체', icon: '🗞️' },
  { key: 'POLITICS', label: '정치', icon: '🏛️' },
  { key: 'ECONOMY', label: '경제', icon: '📈' },
  { key: 'SOCIETY', label: '사회', icon: '👨‍👩‍👧‍👦' },
  { key: 'LIFE_CULTURE', label: '생활ㆍ문화', icon: '👐' },
  { key: 'IT_SCIENCE', label: 'ITㆍ과학', icon: '💡' },
  { key: 'WORLD', label: '세계', icon: '🌍' },
  { key: 'ENTERTAINMENT', label: '엔터', icon: '🎬' },
  { key: 'SPORTS', label: '스포츠', icon: '⚽' },
];

export default function HomePage() {
  const [newsList, setNewsList] = useState<UiNews[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('ALL');
  const [keyword, setKeyword] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchLatestNews({ page: 0, size: 100 });
      const list = (Array.isArray(data) ? data : []) as UiNews[];
      setNewsList(sortNewsByDate(list));
    } catch (err) {
      console.error('홈 뉴스 로딩 실패', err);
      setError('뉴스를 불러오지 못했습니다.');
      setNewsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const filteredNews = useMemo(() => {
    let items = filterDisplayableNews(newsList);
    if (selectedCategory !== 'ALL') {
      items = items.filter(
        (article) => toCategoryKey(article.category as string) === selectedCategory
      );
    }
    if (activeSearchTerm) {
      items = items.filter((article) => matchesSearchTerm(article, activeSearchTerm));
    }
    return sortNewsByDate(items).filter(shouldDisplayNews);
  }, [newsList, selectedCategory, activeSearchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNews = filteredNews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const tickerNews = filteredNews.slice(0, 10);

  const handleSearch = () => {
    setActiveSearchTerm(keyword.trim());
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!keyword.trim()) {
      setActiveSearchTerm('');
    }
  }, [keyword]);

  const handleCategorySelect = (key: string) => {
    if (key === selectedCategory) return;
    setSelectedCategory(key as CategoryKey);
    setCurrentPage(1);
  };

  return (
    <div className="home-container">
      <section className="home-hero">
        <div className="home-hero-controls">
          <SearchBar
            keyword={keyword}
            onChange={setKeyword}
            onSearch={handleSearch}
            logoHref="/home-feed"
          />
          <div className="home-hero-chip-grid">
            {QUICK_CATEGORY_TAGS.map((chip) => (
              <button
                type="button"
                key={chip.key}
                className={`home-hero-chip ${selectedCategory === chip.key ? 'active' : ''}`}
                onClick={() => handleCategorySelect(chip.key)}
              >
                <span className="home-hero-chip-icon">{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>
        </div>
        {tickerNews.length > 0 && (
          <>
            <p className="home-description highlight">최신 기사와 카테고리별 뉴스를 한눈에 확인하세요.</p>
            <div className="home-hero-ticker">
              <NewsTicker newsList={tickerNews} />
            </div>
          </>
        )}
      </section>

      <section className="home-content">
        <div className="home-content-inner">
        {error && <div className="home-status error">{error}</div>}

        {loading ? (
          <div className="home-status info">뉴스를 불러오는 중입니다…</div>
        ) : currentNews.length === 0 ? (
          <div className="home-status empty">
            {activeSearchTerm ? '검색 결과가 없습니다.' : '표시할 기사가 없습니다.'}
          </div>
        ) : (
          <>
            {currentNews.map((news) => (
              <NewsCard key={`${news.id}-${news.title}`} item={news} />
            ))}

            <div className="pagination">
              <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                이전
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>
      </section>
    </div>
  );
}

