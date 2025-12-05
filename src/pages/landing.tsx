import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './landing.css';
import NuzipLogo from './Nuzip_logo2.png';
import DefaultThumbnail from './Nuzip_logo.png';
import { fetchLatestNews } from '../api/nuzipclientapi';
import type { UiNews } from '../types/news';
import { toCategoryLabel } from '../types/news';
import { sortNewsByDate } from '../utils/news';

type HeroPreview = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  imageUrl: string;
};

const NAV_LINKS = [
  { label: '솔루션', href: '#hero' },
  { label: '기능', href: '#feature' },
  { label: '카테고리', href: '#news-preview' },
  { label: '요약기술', href: '#technology' },
  { label: '블로그', href: '#blog' },
];

const BRAND_LOGOS = ['한국일보', '조선비즈', 'ZDNet', '매일경제', '오피니언뉴스'];

const FEATURE_CARDS = [
  {
    title: '개인 맞춤 피드',
    description: '선호 카테고리 기반으로 매일 필요한 뉴스만 간추려 보여드려요.',
  },
  {
    title: 'AI 요약 엔진',
    description: '기사 핵심을 자동으로 정리해 5줄 요약과 키워드를 전달합니다.',
  },
  {
    title: '스크랩 & 메모',
    description: '중요한 기사에 메모를 남겨 나만의 리서치 노트를 만들 수 있어요.',
  },
];

const HERO_ROTATION_INTERVAL = 6000;
const HERO_MAX_ITEMS = 5;

export default function Landing() {
  const navigate = useNavigate();
  const [heroNews, setHeroNews] = useState<HeroPreview[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroError, setHeroError] = useState('');

  const handleStart = () => navigate('/home-feed');
  const handleDemo = () => window.open('https://nuzip.co.kr', '_blank', 'noopener,noreferrer');
  const handleLogin = () => navigate('/login');

  const parseTags = useCallback((news: UiNews): string[] => {
    const raw = news.keywords ?? '';
    const tags = raw
      .split(/[,#]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tags.length > 0) {
      return tags.slice(0, 3);
    }
    if (typeof news.category === 'string') {
      return [toCategoryLabel(news.category)];
    }
    return ['NUZIP'];
  }, []);

  const getPreviewImage = useCallback((news: UiNews, idx: number): string => {
    if (typeof news.imageUrl === 'string' && news.imageUrl.trim().length > 0) {
      return news.imageUrl;
    }
    if (typeof news.thumbnail === 'string' && news.thumbnail.trim().length > 0) {
      return news.thumbnail;
    }
    if (typeof news.urlToImage === 'string' && news.urlToImage.trim().length > 0) {
      return news.urlToImage;
    }
    // create deterministic placeholder per index to vary backgrounds if needed
    return DefaultThumbnail;
  }, []);

  const buildHeroPreview = useCallback(
    (news: UiNews, idx: number): HeroPreview => {
      const summarySource =
        news.summary ||
        (typeof news.description === 'string' ? news.description : '') ||
        (typeof news.content === 'string' ? news.content : '');
      const summary =
        summarySource.length > 90
          ? `${summarySource.slice(0, 87)}…`
          : summarySource || '기사를 불러오는 중입니다.';

      return {
        id: String(news.id ?? `latest-${idx}`),
        title: news.title || '제목 없음',
        summary,
        tags: parseTags(news),
        imageUrl: getPreviewImage(news, idx),
      };
    },
    [parseTags, getPreviewImage]
  );

  const loadHeroNews = useCallback(async () => {
    try {
      const { data } = await fetchLatestNews({ page: 0, size: 60 });
      const items = (Array.isArray(data) ? data : []) as UiNews[];
      const prepared = sortNewsByDate(items)
        .slice(0, HERO_MAX_ITEMS)
        .map(buildHeroPreview)
        .filter((item) => item.title.trim().length > 0);

      if (prepared.length > 0) {
        setHeroNews(prepared);
        setHeroIndex(Math.floor(Math.random() * prepared.length));
        setHeroError('');
      } else {
        setHeroNews([]);
        setHeroIndex(0);
        setHeroError('표시할 카드가 없습니다.');
      }
    } catch (err) {
      console.error('Landing hero news 가져오기 실패', err);
      setHeroNews([]);
      setHeroIndex(0);
      setHeroError('최신 뉴스를 불러오지 못했습니다.');
    }
  }, [buildHeroPreview]);

  useEffect(() => {
    loadHeroNews();
  }, [loadHeroNews]);

  useEffect(() => {
    if (heroNews.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroNews.length);
    }, HERO_ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, [heroNews]);

  const hasHeroNews = heroNews.length > 0;

  return (
    <div className="landing-page">
      <main className="landing-main">
        <section className="hero-section" id="hero">
          <div className="hero-copy">
            <p className="hero-eyebrow">Nuzip Daily Briefing</p>
            <h1>
              The smartest way
              <br /> to read
              the news 
              <br /> every day.
            </h1>
            <p className="hero-lede">
              긴 뉴스도 핵심만 한눈에. 관심 분야만 모아서 매일 아침 전달합니다.
            </p>
            <div className="hero-buttons">
              <button type="button" className="primary-button large" onClick={handleStart}>
                시작하기
              </button>
            </div>
            <p className="hero-hint">
              이미 계정이 있다면?{' '}
              <button type="button" className="link-button" onClick={handleLogin}>
                로그인 후 나만의 뉴스 피드를 확인하세요.
              </button>
            </p>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="mockup-panel">
              <div className="mockup-header">
                <span>Today NEWS</span>
                <span className="badge">
                  {heroError ? '오프라인' : hasHeroNews ? '실시간' : '대기 중'}
                </span>
              </div>
              {hasHeroNews ? (
                <div className="hero-news-slider">
                  <div
                    className="hero-news-track"
                    style={{
                      transform: `translateX(-${heroIndex * 100}%)`,
                    }}
                  >
                    {heroNews.map((news) => (
                      <div className="mockup-card hero-news-card" key={news.id}>
                        <div className="mockup-card-thumb">
                          <img
                            src={news.imageUrl || DefaultThumbnail}
                            alt={news.title}
                            loading="lazy"
                            onError={(event) => {
                              if (event.currentTarget.src !== DefaultThumbnail) {
                                event.currentTarget.src = DefaultThumbnail;
                              }
                            }}
                          />
                        </div>
                        <div className="mockup-card-body">
                          <p className="mockup-card-title">{news.title}</p>
                          <p className="mockup-card-text">{news.summary}</p>
                          <div className="mockup-tags">
                            {news.tags.map((tag) => (
                              <span key={`${news.id}-${tag}`}>#{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="hero-empty-card">
                  <p>{heroError || '표시할 카드가 없습니다.'}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="feature-section" id="feature">
          <div className="section-head">
            <p className="section-label">스마트 뉴스 경험</p>
            <h2>아침 5분이면 하루 트렌드를 파악할 수 있어요.</h2>
            <p className="section-subtitle">
              개인 맞춤 추천부터 AI 요약, 스크랩과 메모까지 한 번에 제공합니다.
            </p>
          </div>
          <div className="feature-grid">
            {FEATURE_CARDS.map((feature) => (
              <article key={feature.title} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section" id="blog">
          <h2>지금 바로 여러분만의 뉴스 브리핑을 시작해보세요!</h2>
          <button type="button" className="primary-button large" onClick={() => navigate('/register-choice')}>
            가입하기
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <span>NUZIP © 2025</span>
        <nav>
          <a href="#hero">서비스 소개</a>
          <a href="/privacy" onClick={(event) => event.preventDefault()}>
            개인정보 처리방침
          </a>
          <a href="mailto:contact@nuzip.co.kr">문의</a>
        </nav>
      </footer>
    </div>
  );
}
