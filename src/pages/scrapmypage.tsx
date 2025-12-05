import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createMemo as createMemoApi,
  deleteMemo as deleteMemoApi,
  getMyScraps,
  removeScrap,
  submitRating,
  updateMemo as updateMemoApi,
  type ScrapDto,
} from '../api/nuzipclientapi';
import { withCachedScrapImage } from '../utils/scrap';
import './scrapmypage.css';
import DefaultThumbnail from './Nuzip_logo.png';

import BookmarkIcon from '@mui/icons-material/Bookmark';
import StarRateIcon from '@mui/icons-material/StarRate';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';

// 더미데이터 환경 변수 처리(테스트용)
const resolveUseDummyFlag = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteValue = import.meta.env.VITE_USE_DUMMY_SCRAP_DATA;
    if (viteValue !== undefined) {
      return viteValue === 'true';
    }
  }
  // Vite 환경에서만 사용할 것이므로 CRA(process.env) 분기는 제거
  return true; // 환경변수가 없으면 기본값: 더미 데이터 사용
};

const USE_DUMMY_DATA = resolveUseDummyFlag();

// 더미 데이터
const DUMMY_SCRAPS = [
  {
    id: 1,
    title: '[경제] 미국 기준금리 동결…한국 금융시장 영향은?',
    summary:
      '미 연준이 기준금리를 동결하면서 원·달러 환율과 코스피 지수에 어떤 영향을 줄지 관심이 모이고 있습니다.',
    article:
      '연방준비제도(Fed)가 네 차례 연속으로 기준금리를 동결하면서 미국 국채 금리가 급등락했고, 이에 연동된 원·달러 환율도 장중 1,360원대 중후반까지 치솟았습니다. 금융당국은 단기 변동성은 확대되겠지만 연말로 갈수록 수급 요인이 완화될 것으로 보고 있습니다.\n\n국내 증시는 은행·보험 등 금리 수혜 업종이 방어력을 보였고, 2차전지와 성장주에는 차익 매물이 출회됐습니다. 외국인 투자자는 선물 시장에서 헷지 비중을 늘렸지만, 현물에선 업종별로 엇갈린 매매를 이어가며 관망세를 택했습니다.\n\n전문가들은 잭슨홀 미팅 이후 나올 추가 힌트와 12월 점도표를 동시에 확인해야 방향성이 잡힐 것이라며, 가계대출 변동금리 차주의 원리금 부담을 다시 한번 점검할 시기라고 조언했습니다.',
    createdAt: '2025-11-28T09:00:00',
    url: 'https://news.example.com/economy-rate',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=640&q=80&auto=format',
    memos: [
      {
        id: 101,
        content: '달러 약세 오면 여행 관련주도 같이 체크해보기.',
        updatedAt: '2025-11-28T09:15:00',
      },
      {
        id: 102,
        content: '경제뉴스 메모 더미데이터2',
        updatedAt: '2025-11-28T09:17:00',
      },
      {
        id: 103,
        content: '경제뉴스 메모 더미데이터3',
        updatedAt: '2025-11-28T10:22:00',
      },
    ],
  },
  {
    id: 2,
    title: '[IT/과학] 생성형 AI 규제 법안, 유럽 의회 통과',
    summary:
      '유럽 의회가 생성형 AI 규제 법안을 통과시키면서 글로벌 빅테크 기업들의 대응이 주목되고 있습니다.',
    article:
      '유럽 의회는 생성형 AI 모델에 대한 투명성 의무를 명문화하면서 파라미터 규모가 일정 기준을 넘는 모델에 대해선 데이터 셋 공개와 위험 평가 보고서를 의무화했습니다. 이는 챗봇 서비스뿐 아니라 이미지·음성 합성 서비스에도 동일하게 적용됩니다.\n\n구글, 메타, 오픈AI 등 글로벌 사업자들은 이미 개별 회원국과의 협의 채널을 가동했고, 한국 정부도 이번 법안의 세부 시행령을 면밀히 모니터링하며 국내 기업이 불이익을 받지 않도록 대응책을 마련 중입니다.\n\n국내 스타트업 업계에서는 개인정보 비식별 조치와 저작권 관리 툴 수요가 급증할 것으로 예상하고 있으며, 일부 기업은 유럽 현지 법률 자문단을 꾸려 출시 일정 조정을 검토하고 있습니다.',
    createdAt: '2025-11-27T21:30:00',
    url: 'https://news.example.com/ai-regulation',
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=640&q=80&auto=format',
    memos: [
      {
        id: 102,
        content: '나중에 프로젝트 발표할 때 AI 규제 이슈 예시로 써도 좋을 듯.',
        updatedAt: '2025-11-27T22:00:00',
      },
      {
        id: 103,
        content: 'GDPR이랑 같이 묶어서 정리 필요.',
        updatedAt: '2025-11-27T22:10:00',
      },
    ],
  },
  {
    id: 3,
    title: '[사회] 2030 세대, 뉴스 소비 패턴 변화',
    summary:
      '긴 기사보다 요약본·하이라이트 위주의 뉴스 소비가 늘어나고 있다는 조사 결과가 나왔습니다.',
    article:
      '2030 세대는 출근 준비나 이동 시간에 1~3분 내외로 요약된 뉴스레터와 숏폼 영상을 소비하는 경향이 뚜렷하게 나타났습니다. 데이터 분석 기업 인사이트랩은 전체 응답자의 62%가 긴 기사를 끝까지 읽지 않는다고 조사했습니다.\n\n대신 실시간 이슈를 빠르게 파악한 뒤 관심 분야는 블로그나 포럼에서 추가 정보를 찾는 깊게 읽기 방식이 확산되고 있습니다. 알고리즘이 추천한 콘텐츠에만 의존하지 않기 위해 큐레이션 기반 뉴스 서비스를 이용한다는 답변도 늘었습니다.\n\n미디어 업계는 맞춤형 알림과 인터랙티브 카드 뉴스 등 사용자 참여형 포맷을 확대하면서, 뉴스 소비 데이터를 다시 제작 과정에 반영하는 순환 구조를 실험하고 있습니다.',
    createdAt: '2025-11-26T13:20:00',
    url: 'https://news.example.com/news-consumption',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=640&q=80&auto=format',
    memos: [],
  },
];

export default function ScrapMyPage() {
  // 초기값을 더미 데이터로 설정
  const initialScraps = (USE_DUMMY_DATA ? DUMMY_SCRAPS : []) as ScrapDto[];
  const [scraps, setScraps] = useState<ScrapDto[]>(
    initialScraps.map((scrap) => withCachedScrapImage(scrap)),
  );
  const [selectedScrapId, setSelectedScrapId] = useState(
    () => (USE_DUMMY_DATA ? initialScraps[0]?.id ?? null : null),
  );
  const [detailVisible, setDetailVisible] = useState(false);
  const [loading, setLoading] = useState(!USE_DUMMY_DATA);

  // 메모 관련
  const [memoDraft, setMemoDraft] = useState('');
  const [memoBusy, setMemoBusy] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingScrapId, setEditingScrapId] = useState(null);

// 기사별 메모 접힘/펼침
const [articleMemosOpen, setArticleMemosOpen] = useState(true);

  // 평점 모달
  const [ratingModal, setRatingModal] = useState({
    open: false,
    scrap: null,
    rating: 0,
    feedback: '',
  });
  const [ratingBusy, setRatingBusy] = useState(false);

  // 배너
  const [banner, setBanner] = useState(null);

  const location = useLocation();
  const locationKeyRef = useRef(location.key);

  const closeRatingModal = useCallback(() => {
    setRatingModal({
      open: false,
      scrap: null,
      rating: 0,
      feedback: '',
    });
  }, []);

  const openRatingModal = useCallback((scrap) => {
    setRatingModal({
      open: true,
      scrap,
      rating: 0,
      feedback: '',
    });
  }, []);

  const selectedScrap = useMemo(
    () => scraps.find((scrap) => scrap.id === selectedScrapId) || null,
    [scraps, selectedScrapId],
  );
  // 
  const allArticleMemos = useMemo(
    () =>
      scraps.flatMap((scrap) =>
        (scrap.memos || []).map((memo) => ({
          ...memo,
          scrapId: scrap.id,
          scrapTitle: scrap.title,
        })),
      ),
    [scraps],
  );

  const showBanner = useCallback((type, text) => {
    setBanner({ type, text });
  }, []);

  useEffect(() => {
    if (!banner) return undefined;
    const timer = setTimeout(() => setBanner(null), 3500);
    return () => clearTimeout(timer);
  }, [banner]);

  // 라우터 이동 시 상태 초기화
  useEffect(() => {
    if (locationKeyRef.current === location.key) return;
    locationKeyRef.current = location.key;
    closeRatingModal();
    setDetailVisible(false);
    setMemoDraft('');
    setEditingMemoId(null);
    setEditingContent('');
    setSelectedScrapId(() => {
      if (!scraps.length) return null;
      return scraps[0].id;
    });
  }, [location.key, scraps, closeRatingModal]);

  // ESC 로 모달 닫기
  useEffect(() => {
    if (!ratingModal.open) return undefined;
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeRatingModal();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [ratingModal.open, closeRatingModal]);

  // 스크랩 목록 불러오기
  const loadScraps = useCallback(async () => {
    if (USE_DUMMY_DATA) return;
    setLoading(true);
    try {
      const { data } = await getMyScraps();
      const normalized = (Array.isArray(data) ? data : []).map((scrap) =>
        withCachedScrapImage(scrap),
      );
      setScraps(normalized);
      setSelectedScrapId((prevId) => {
        if (!data.length) return null;
        if (prevId && data.some((item) => item.id === prevId)) {
          return prevId;
        }
        return data[0].id;
      });
    } catch (err) {
      console.error('스크랩 불러오기 실패', err);
      setScraps([]);
      setSelectedScrapId(null);
      showBanner('error', err.response?.data?.message || '스크랩 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [showBanner]);

  useEffect(() => {
    if (USE_DUMMY_DATA) return;
    loadScraps();
  }, [loadScraps]);

  // 스크랩 선택 / 토글
  const handleSelectScrap = (scrapId) => {
    if (selectedScrapId === scrapId && detailVisible) {
      setDetailVisible(false);
      setSelectedScrapId(null);
      setMemoDraft('');
      setEditingMemoId(null);
      setEditingContent('');
      closeRatingModal();
      return;
    }

    setSelectedScrapId(scrapId);
    setDetailVisible(true);
    setMemoDraft('');
    setEditingMemoId(null);
    setEditingContent('');
    closeRatingModal();
  };

  // 스크랩 삭제
  const handleDeleteScrap = async (scrapId) => {
    if (!window.confirm('이 스크랩을 삭제할까요?')) return;

    setScraps((prevScraps) => {
      const next = prevScraps.filter((scrap) => scrap.id !== scrapId);
      if (!next.length) {
        setSelectedScrapId(null);
        setDetailVisible(false);
      } else if (selectedScrapId === scrapId) {
        setSelectedScrapId(next[0].id);
        setDetailVisible(true);
      }
      return next;
    });

    closeRatingModal();

    if (USE_DUMMY_DATA) {
      showBanner('success', '스크랩을 삭제했습니다.');
      return;
    }

    try {
      await removeScrap(scrapId);
      showBanner('success', '스크랩을 삭제했습니다.');
      await loadScraps();
    } catch (err) {
      console.error('스크랩 삭제 실패', err);
      showBanner('error', err.response?.data?.message || '스크랩 삭제에 실패했습니다.');
      await loadScraps();
    }
  };

  // 메모 생성
  const handleCreateMemo = async () => {
    if (!selectedScrap || !memoDraft.trim()) return;
    const content = memoDraft.trim();

    if (USE_DUMMY_DATA) {
      const now = new Date().toISOString();
      const newMemo = {
        id: Date.now(),
        content,
        updatedAt: now,
      };
      setScraps((prev) =>
        prev.map((scrap) =>
          scrap.id === selectedScrap.id
            ? {
                ...scrap,
                memos: [...(scrap.memos || []), newMemo],
              }
            : scrap,
        ),
      );
      setMemoDraft('');
      showBanner('success', '메모를 추가했습니다.');
      return;
    }

    setMemoBusy(true);
    try {
      await createMemoApi({ scrapId: selectedScrap.id, content });
      setMemoDraft('');
      showBanner('success', '메모를 추가했습니다.');
      await loadScraps();
    } catch (err) {
      console.error('메모 저장 실패', err);
      showBanner('error', err.response?.data?.message || '메모 저장에 실패했습니다.');
    } finally {
      setMemoBusy(false);
    }
  };

  // 메모 수정모드 진입
  const handleStartEditMemo = (memo) => {
    const targetScrapId = memo.scrapId ?? selectedScrap?.id ?? null;
    setEditingMemoId(memo.id);
    setEditingScrapId(targetScrapId);
    setEditingContent(memo.content);
  };

  const handleCancelEdit = () => {
    setEditingMemoId(null);
    setEditingScrapId(null);
    setEditingContent('');
  };

  // 메모 업데이트
  const handleUpdateMemo = async () => {
    if (!editingMemoId || !editingScrapId || !editingContent.trim()) return;
    const content = editingContent.trim();

    if (USE_DUMMY_DATA) {
      const now = new Date().toISOString();
      setScraps((prev) =>
        prev.map((scrap) => {
          if (scrap.id !== editingScrapId) return scrap;
          return {
            ...scrap,
            memos: (scrap.memos || []).map((memo) =>
              memo.id === editingMemoId ? { ...memo, content, updatedAt: now } : memo,
            ),
          };
        }),
      );
      showBanner('success', '메모를 수정했습니다.');
      setEditingMemoId(null);
      setEditingScrapId(null);
      setEditingContent('');
      return;
    }

    setMemoBusy(true);
    try {
      await updateMemoApi(editingMemoId, {
        scrapId: editingScrapId,
        content,
      });

      showBanner('success', '메모를 수정했습니다.');
      setEditingMemoId(null);
      setEditingScrapId(null);
      setEditingContent('');
      await loadScraps();
    } catch (err) {
      console.error('메모 수정 실패', err);
      showBanner('error', err.response?.data?.message || '메모 수정에 실패했습니다.');
    } finally {
      setMemoBusy(false);
    }
  };

  // 기사 메모 삭제
  const handleDeleteMemo = async (memoId) => {
    if (!window.confirm('이 메모를 삭제할까요?')) return;

    if (USE_DUMMY_DATA) {
      setScraps((prev) =>
        prev.map((scrap) => {
          const memos = scrap.memos || [];
          if (!memos.some((memo) => memo.id === memoId)) return scrap;
          return {
            ...scrap,
            memos: memos.filter((memo) => memo.id !== memoId),
          };
        }),
      );
      showBanner('success', '메모를 삭제했습니다.');
      if (editingMemoId === memoId) {
        setEditingMemoId(null);
        setEditingScrapId(null);
        setEditingContent('');
      }
      return;
    }

    setMemoBusy(true);
    try {
      await deleteMemoApi(memoId);
      showBanner('success', '메모를 삭제했습니다.');
      if (editingMemoId === memoId) {
        setEditingMemoId(null);
        setEditingScrapId(null);
        setEditingContent('');
      }
      await loadScraps();
    } catch (err) {
      console.error('메모 삭제 실패', err);
      showBanner('error', err.response?.data?.message || '메모 삭제에 실패했습니다.');
    } finally {
      setMemoBusy(false);
    }
  };

  // 평점 전송
  const handleSubmitRating = async (event) => {
    event?.preventDefault();
    if (!ratingModal.scrap) return;
    if (!ratingModal.rating) {
      showBanner('error', '별점을 1~5 사이에서 선택해주세요.');
      return;
    }

    if (USE_DUMMY_DATA) {
      showBanner('success', 'AI에게 피드백을 전달했습니다.');
      closeRatingModal();
      return;
    }

    setRatingBusy(true);
    try {
      await submitRating({
        scrapId: ratingModal.scrap.id,
        rating: Number(ratingModal.rating),
        feedback: ratingModal.feedback?.trim() || '',
        sendToGemini: true,
      });
      showBanner('success', 'AI에게 피드백을 전달했습니다.');
      closeRatingModal();
    } catch (err) {
      console.error('평점 저장 실패', err);
      showBanner('error', err.response?.data?.message || '평점을 저장하지 못했습니다.');
    } finally {
      setRatingBusy(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '';

    const d = new Date(value); // ISO/일반 문자열 모두 처리

    if (Number.isNaN(d.getTime())) {
      // 혹시 파싱이 안 되는 특이한 문자열이면 기존 방식으로 fallback
      return value.replace('T', ' ').slice(0, 16);
    }

    const pad = (n) => String(n).padStart(2, '0');

    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());

    // 한국 로컬 시간 기준 문자열
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };


  const layoutClass =
    selectedScrap && detailVisible
      ? 'scrap-page__grid scrap-page__grid--detail'
      : 'scrap-page__grid';

  return (
    <div className="scrap-page">
      {banner && (
        <div className={`scrap-page__banner scrap-page__banner--${banner.type}`}>
          {banner.text}
        </div>
      )}

      <div className={layoutClass}>
        {/* 왼쪽 스크랩 리스트 */}
        <aside className="scrap-page__sidebar">
          <div className="scrap-page__sidebar-header">
            <h2>스크랩 뉴스 리스트</h2>
          </div>

          {loading ? (
            <div className="scrap-page__placeholder">불러오는 중…</div>
          ) : scraps.length === 0 ? (
            <div className="scrap-page__placeholder">아직 스크랩한 뉴스가 없습니다.</div>
          ) : (
            <ul className="scrap-list">
              {scraps.map((scrap) => (
                <li
                  key={scrap.id}
                  className={`scrap-item ${
                    selectedScrapId === scrap.id ? 'scrap-item--active' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="scrap-item__body"
                    onClick={() => handleSelectScrap(scrap.id)}
                  >
                    <div className="scrap-item__preview">
                      <img
                        src={scrap.imageUrl || DefaultThumbnail}
                        alt={scrap.title}
                        className="scrap-item__thumbnail"
                        loading="lazy"
                      />
                    </div>
                    <div className="scrap-item__text">
                      <h4>{scrap.title}</h4>
                      <p>{scrap.summary || '요약이 없습니다.'}</p>
                    </div>
                  </button>
                  <div className="scrap-item__footer">
                    <span className="scrap-item__date">{formatDate(scrap.createdAt)}</span>
                    <div className="scrap-item__actions">
                      <button
                        type="button"
                        className="icon-button icon-button--active"
                        title="스크랩 삭제"
                        onClick={() => handleDeleteScrap(scrap.id)}
                      >
                        <BookmarkIcon fontSize="small" />
                      </button>

                      {(() => {
                        const ratingActive =
                          ratingModal.open && ratingModal.scrap?.id === scrap.id;
                        const ratingButtonClass = [
                          'icon-button',
                          'rating-button',
                          ratingActive ? 'rating-button--active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <button
                            type="button"
                            className={ratingButtonClass}
                            title="평점 남기기"
                            onClick={() => openRatingModal(scrap)}
                          >
                            <StarBorderIcon
                              className="rating-icon rating-icon--outline"
                              fontSize="small"
                            />
                            <StarRateIcon
                              className="rating-icon rating-icon--filled"
                              fontSize="small"
                            />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* 가운데 기사 원문 */}
        {detailVisible && selectedScrap && (
          <section className="scrap-page__article">
            <header className="article-panel__header">
              <h3>뉴스 기사의 원문내용</h3>
            </header>
            <article className="article-panel">
              <h4>{selectedScrap.title}</h4>
              <div className="article-panel__media">
                <img
                  src={selectedScrap.imageUrl || DefaultThumbnail}
                  alt={selectedScrap.title}
                  className="article-panel__thumbnail"
                  loading="lazy"
                />
              </div>
              {selectedScrap.summary ? (
                <p className="article-panel__summary">{selectedScrap.summary}</p>
              ) : (
                <p className="article-panel__summary">요약 정보가 없습니다.</p>
              )}
              {selectedScrap.url && (
                <a
                  className="article-panel__link"
                  href={selectedScrap.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  원문 보기
                </a>
              )}
            </article>
          </section>
        )}

        {/* 오른쪽 메모장 */}
        <section className="scrap-page__memo">
          <h2>메모장</h2>

          {detailVisible && selectedScrap ? (
            <>
              <p className="memo-subtitle">
                현재 선택한 기사: <strong>{selectedScrap.title}</strong>
              </p>

              <div className="memo-list">
                {(selectedScrap.memos || []).length === 0 ? (
                  <p className="scrap-page__placeholder">메모가 없습니다.</p>
                ) : (
                  selectedScrap.memos.map((memo) => (
                    <div className="memo-card" key={memo.id}>
                      {editingMemoId === memo.id ? (
                        <>
                          <textarea
                            className="memo-textarea"
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                          />
                          <div className="memo-card__actions">
                            <button
                              type="button"
                              className="memo-btn memo-btn--secondary"
                              onClick={handleCancelEdit}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              className="memo-btn memo-btn--primary"
                              onClick={handleUpdateMemo}
                              disabled={memoBusy}
                            >
                              {memoBusy ? '저장 중…' : '저장'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p>{memo.content}</p>
                          <div className="memo-card__meta">
                            <span>{formatDate(memo.updatedAt)}</span>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleStartEditMemo(memo)}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMemo(memo.id)}
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 기사 메모 작성창 */}
              <div className="memo-form">
                <textarea
                  className="memo-textarea"
                  rows={4}
                  placeholder="이 기사에 대한 메모를 남겨보세요."
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="memo-btn memo-btn--primary"
                  onClick={handleCreateMemo}
                  disabled={!memoDraft.trim() || memoBusy}
                >
                  {memoBusy ? '저장 중…' : '작성'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 1) 기사별 메모 전체 리스트 */}
              <div className="memo-section memo-section--article">
                <h4
                  className="memo-section__title memo-section__title--clickable"
                  onClick={() => setArticleMemosOpen((prev) => !prev)}
                >
                  기사별 메모
                </h4>

                {articleMemosOpen && (
                  <div className="memo-list">
                    {allArticleMemos.length === 0 ? (
                      <p className="scrap-page__placeholder">
                        아직 기사에 남긴 메모가 없습니다.
                      </p>
                    ) : (
                      allArticleMemos.map((memo) => (
                        <div className="memo-card" key={memo.id}>
                          <p className="memo-card__scrap-title">{memo.scrapTitle}</p>
                          <p>{memo.content}</p>
                          <div className="memo-card__meta">
                            <span>{formatDate(memo.updatedAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </>
          )}
        </section>
      </div>

      {/* 평점 모달 */}
      {ratingModal.open && (
        <div className="rating-modal" role="dialog" aria-modal="true">
          <div className="rating-modal__backdrop" onClick={closeRatingModal} />
          <form className="rating-modal__dialog" onSubmit={handleSubmitRating}>
            <div className="rating-modal__header">
              <h4>{ratingModal.scrap?.title}</h4>
              <p>{ratingModal.scrap?.summary || '요약이 없습니다.'}</p>
            </div>
            <div className="rating-modal__body">
              {/* 별점 선택 영역 */}
              <div className="rating-modal__stars-wrapper">
                <span className="rating-modal__stars-label">별점 선택</span>
                <div className="rating-modal__stars">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = value <= (ratingModal.rating || 0);
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`star-button ${active ? 'star-button--active' : ''}`}
                        onClick={() =>
                          setRatingModal((prev) => ({
                            ...prev,
                            rating: value,
                          }))
                        }
                        aria-label={`${value}점 선택`}
                      >
                        {active ? (
                          <StarIcon fontSize="inherit" />
                        ) : (
                          <StarBorderIcon fontSize="inherit" />
                        )}
                      </button>
                    );
                  })}
                  <span className="rating-modal__score">
                    {ratingModal.rating || 0}/5
                  </span>
                </div>
              </div>

              {/* 피드백 입력 */}
              <label>
                AI 요약 피드백
                <textarea
                  className="memo-textarea"
                  rows={4}
                  placeholder="AI에게 전달할 의견을 입력해주세요."
                  value={ratingModal.feedback}
                  onChange={(e) =>
                    setRatingModal((prev) => ({
                      ...prev,
                      feedback: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="rating-modal__footer">
              <button type="button" onClick={closeRatingModal} disabled={ratingBusy}>
                취소
              </button>
              <button type="submit" disabled={ratingBusy}>
                {ratingBusy ? '전송 중…' : '전송'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
