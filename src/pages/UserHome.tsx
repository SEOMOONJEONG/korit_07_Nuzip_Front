import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import CategoryTabs from '../components/CategoryTabs';
import UserNewsCard from '../components/UserNewsCard';
import ScrapRatingModal from '../components/ScrapRatingModal';
import { useScrapManager } from '../hooks/useScrapManager';
import { fetchLatestNews, fetchNewsByCategory, getMyCategories } from '../api/nuzipclientapi';
import type { UiNews, CategoryKey } from '../types/news';
import { DEFAULT_CATEGORY_OPTIONS, toCategoryKey, toCategoryLabel } from '../types/news';
import { filterDisplayableNews, matchesSearchTerm, sortNewsByDate } from '../utils/news';
import './UserHome.css';
import '../components/components.css';

const FALLBACK_CATEGORIES: CategoryKey[] = ['POLITICS', 'ECONOMY', 'IT_SCIENCE'];
const ITEMS_PER_PAGE = 8;

export default function UserHome() {
  const [userCategories, setUserCategories] = useState<CategoryKey[]>(FALLBACK_CATEGORIES);
  const [newsByCategory, setNewsByCategory] = useState<Record<string, UiNews[]>>({});
  const [latestNews, setLatestNews] = useState<UiNews[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [keyword, setKeyword] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrapManager = useScrapManager({ enabled: true });

  const loadUserData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const categoryResponse = await getMyCategories();
      const normalized = (Array.isArray(categoryResponse) && categoryResponse.length > 0
        ? categoryResponse
        : FALLBACK_CATEGORIES
      )
        .map((value) => toCategoryKey(value as string))
        .filter((value): value is CategoryKey => value !== 'UNKNOWN');

      const uniqueCategories =
        normalized.length > 0 ? Array.from(new Set(normalized)) : FALLBACK_CATEGORIES;
      setUserCategories(uniqueCategories);

      const [latestRes, ...categoryResults] = await Promise.all([
        fetchLatestNews({ page: 0, size: 60 }),
        ...uniqueCategories.map((category) =>
          fetchNewsByCategory(category, { page: 0, size: 20 })
            .then((res) => ({ category, data: res.data as UiNews[] }))
            .catch(() => ({ category, data: [] as UiNews[] }))
        ),
      ]);

      const latestItems = (Array.isArray(latestRes.data) ? latestRes.data : []) as UiNews[];
      setLatestNews(filterDisplayableNews(sortNewsByDate(latestItems)));

      const categoryMap: Record<string, UiNews[]> = {};
      categoryResults.forEach(({ category, data }) => {
        categoryMap[category] = filterDisplayableNews(
          sortNewsByDate(Array.isArray(data) ? data : [])
        );
      });
      setNewsByCategory(categoryMap);

      const nextPageState: Record<string, number> = {};
      uniqueCategories.forEach((category) => {
        nextPageState[category] = 1;
      });
      setCategoryPage(nextPageState);
    } catch (err) {
      console.error('사용자 홈 데이터 로딩 실패', err);
      setError('개인화 뉴스를 불러오지 못했습니다.');
      setLatestNews([]);
      setNewsByCategory({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const getNewsForCategory = useCallback(
    (category: CategoryKey): UiNews[] => {
      const explicit = newsByCategory[category] ?? [];
      if (explicit.length > 0) {
        return explicit;
      }
      return sortNewsByDate(
        filterDisplayableNews(
          latestNews.filter((news) => toCategoryKey(news.category as string) === category)
        )
      );
    },
    [newsByCategory, latestNews]
  );

  const aggregatedNews = useMemo(
    () => userCategories.flatMap((category) => getNewsForCategory(category)),
    [userCategories, getNewsForCategory]
  );

  const listForSelectedTab = useMemo(() => {
    if (selectedTab === 'ALL') {
      return aggregatedNews;
    }
    const categoryKey = toCategoryKey(selectedTab);
    if (categoryKey === 'UNKNOWN') {
      return [];
    }
    return getNewsForCategory(categoryKey);
  }, [selectedTab, aggregatedNews, getNewsForCategory]);

  const searchResults = useMemo(() => {
    if (!activeSearchTerm) return [];
    return sortNewsByDate(
      aggregatedNews.filter((item) => matchesSearchTerm(item, activeSearchTerm))
    );
  }, [activeSearchTerm, aggregatedNews]);

  const pagedSearchResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchResults.slice(start, start + ITEMS_PER_PAGE);
  }, [searchResults, currentPage]);

  const pagedSelectedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return listForSelectedTab.slice(start, start + ITEMS_PER_PAGE);
  }, [listForSelectedTab, currentPage]);

  const handleSearch = () => {
    setActiveSearchTerm(keyword.trim());
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!keyword.trim()) {
      setActiveSearchTerm('');
    }
  }, [keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab]);

  const handleTabSelect = (key: string) => {
    setSelectedTab(key);
  };

  const handleCategoryPageChange = (category: string, delta: number, total: number) => {
    setCategoryPage((prev) => {
      const current = prev[category] ?? 1;
      const next = Math.min(Math.max(1, current + delta), total);
      return { ...prev, [category]: next };
    });
  };

  const renderAllColumns = () => {
    if (userCategories.length === 0) {
      return <div className="user-home-status empty">선호 카테고리를 먼저 등록해 주세요.</div>;
    }

    return (
      <div className="user-home-columns">
        {userCategories.map((category) => {
          const list = getNewsForCategory(category);
          const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
          const page = categoryPage[category] ?? 1;
          const start = (page - 1) * ITEMS_PER_PAGE;
          const paginated = list.slice(start, start + ITEMS_PER_PAGE);

          return (
            <section key={category} className="user-home-column">
              <h2>{toCategoryLabel(category)}</h2>
              <hr />
              {paginated.length === 0 ? (
                <p className="user-home-status empty">해당 카테고리의 기사가 없습니다.</p>
              ) : (
                paginated.map((item) => (
                  <UserNewsCard
                    key={`${item.id}-${item.title}`}
                    item={item}
                    scrapManager={scrapManager}
                  />
                ))
              )}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    onClick={() => handleCategoryPageChange(category, -1, totalPages)}
                    disabled={page === 1}
                  >
                    이전
                  </button>
                  <span>
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCategoryPageChange(category, 1, totalPages)}
                    disabled={page === totalPages}
                  >
                    다음
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  };

  const renderSearchMode = () => {
    const totalPages = Math.max(1, Math.ceil(searchResults.length / ITEMS_PER_PAGE));
    return (
      <div className="user-home-single-column">
        {pagedSearchResults.length === 0 ? (
          <div className="user-home-status empty">검색 결과가 없습니다.</div>
        ) : (
          pagedSearchResults.map((item) => (
            <UserNewsCard
              key={`${item.id}-${item.title}`}
              item={item}
              scrapManager={scrapManager}
            />
          ))
        )}
        {searchResults.length > ITEMS_PER_PAGE && (
          <div className="pagination">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
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
        )}
      </div>
    );
  };

  const renderSingleCategory = () => {
    const totalPages = Math.max(1, Math.ceil(listForSelectedTab.length / ITEMS_PER_PAGE));
    if (pagedSelectedList.length === 0) {
      return <div className="user-home-status empty">해당 카테고리의 기사가 없습니다.</div>;
    }

    return (
      <div className="user-home-single-column">
        {pagedSelectedList.map((item) => (
          <UserNewsCard
            key={`${item.id}-${item.title}`}
            item={item}
            scrapManager={scrapManager}
          />
        ))}
        {listForSelectedTab.length > ITEMS_PER_PAGE && (
          <div className="pagination">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
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
        )}
      </div>
    );
  };

  const categoryOptions = [
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

  return (
    <div className="user-home-container">
      <section className="user-home-hero">
        <div className="user-home-hero-controls">
          <SearchBar
            keyword={keyword}
            onChange={setKeyword}
            onSearch={handleSearch}
            placeholder="관심 기사 내용을 검색해 보세요"
            logoHref="/home"
          />
          <div className="user-home-chip-grid">
            {categoryOptions.map((option) => (
              <button
                type="button"
                key={option.key}
                className={`user-home-chip ${selectedTab === option.key ? 'active' : ''}`}
                onClick={() => handleTabSelect(option.key)}
              >
                <span className="user-home-chip-icon">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {scrapManager.message && <div className="user-home-status info">{scrapManager.message}</div>}

      {error && <div className="user-home-status error">{error}</div>}

      {loading ? (
        <div className="user-home-status info">맞춤형 기사를 불러오는 중입니다…</div>
      ) : activeSearchTerm ? (
        renderSearchMode()
      ) : selectedTab === 'ALL' ? (
        renderAllColumns()
      ) : (
        renderSingleCategory()
      )}

      <ScrapRatingModal manager={scrapManager} />
    </div>
  );
}
