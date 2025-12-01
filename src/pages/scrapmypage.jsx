import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createMemo as createMemoApi,
  deleteMemo as deleteMemoApi,
  getMyScraps,
  removeScrap,
  submitRating,
  updateMemo as updateMemoApi,
} from '../api/nuzipclientapi';
import './scrapmypage.css';

import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import StarRateIcon from '@mui/icons-material/StarRate';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';


const resolveUseDummyFlag = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteValue = import.meta.env.VITE_USE_DUMMY_SCRAP_DATA;
    if (viteValue !== undefined) {
      return viteValue === 'true';
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    const craValue = process.env.REACT_APP_USE_DUMMY_SCRAP_DATA;
    if (craValue !== undefined) {
      return craValue === 'true';
    }
  }
  return true;
};

const USE_DUMMY_DATA = resolveUseDummyFlag();

// (1) 더미 데이터 추가
const DUMMY_SCRAPS = [
  {
    id: 1,
    title: '[경제] 미국 기준금리 동결…한국 금융시장 영향은?',
    summary: '미 연준이 기준금리를 동결하면서 원·달러 환율과 코스피 지수에 어떤 영향을 줄지 관심이 모이고 있습니다.',
    article: '연방준비제도(Fed)가 네 차례 연속으로 기준금리를 동결하면서 미국 국채 금리가 급등락했고, 이에 연동된 원·달러 환율도 장중 1,360원대 중후반까지 치솟았습니다. 금융당국은 단기 변동성은 확대되겠지만 연말로 갈수록 수급 요인이 완화될 것으로 보고 있습니다.\n\n국내 증시는 은행·보험 등 금리 수혜 업종이 방어력을 보였고, 2차전지와 성장주에는 차익 매물이 출회됐습니다. 외국인 투자자는 선물 시장에서 헷지 비중을 늘렸지만, 현물에선 업종별로 엇갈린 매매를 이어가며 관망세를 택했습니다.\n\n전문가들은 잭슨홀 미팅 이후 나올 추가 힌트와 12월 점도표를 동시에 확인해야 방향성이 잡힐 것이라며, 가계대출 변동금리 차주의 원리금 부담을 다시 한번 점검할 시기라고 조언했습니다.',
    createdAt: '2025-11-28T09:00:00',
    url: 'https://news.example.com/economy-rate',
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
    summary: '유럽 의회가 생성형 AI 규제 법안을 통과시키면서 글로벌 빅테크 기업들의 대응이 주목되고 있습니다.',
    article: '유럽 의회는 생성형 AI 모델에 대한 투명성 의무를 명문화하면서 파라미터 규모가 일정 기준을 넘는 모델에 대해선 데이터 셋 공개와 위험 평가 보고서를 의무화했습니다. 이는 챗봇 서비스뿐 아니라 이미지·음성 합성 서비스에도 동일하게 적용됩니다.\n\n구글, 메타, 오픈AI 등 글로벌 사업자들은 이미 개별 회원국과의 협의 채널을 가동했고, 한국 정부도 이번 법안의 세부 시행령을 면밀히 모니터링하며 국내 기업이 불이익을 받지 않도록 대응책을 마련 중입니다.\n\n국내 스타트업 업계에서는 개인정보 비식별 조치와 저작권 관리 툴 수요가 급증할 것으로 예상하고 있으며, 일부 기업은 유럽 현지 법률 자문단을 꾸려 출시 일정 조정을 검토하고 있습니다.',
    createdAt: '2025-11-27T21:30:00',
    url: 'https://news.example.com/ai-regulation',
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
    summary: '긴 기사보다 요약본·하이라이트 위주의 뉴스 소비가 늘어나고 있다는 조사 결과가 나왔습니다.',
    article: '2030 세대는 출근 준비나 이동 시간에 1~3분 내외로 요약된 뉴스레터와 숏폼 영상을 소비하는 경향이 뚜렷하게 나타났습니다. 데이터 분석 기업 인사이트랩은 전체 응답자의 62%가 긴 기사를 끝까지 읽지 않는다고 조사했습니다.\n\n대신 실시간 이슈를 빠르게 파악한 뒤 관심 분야는 블로그나 포럼에서 추가 정보를 찾는 깊게 읽기 방식이 확산되고 있습니다. 알고리즘이 추천한 콘텐츠에만 의존하지 않기 위해 큐레이션 기반 뉴스 서비스를 이용한다는 답변도 늘었습니다.\n\n미디어 업계는 맞춤형 알림과 인터랙티브 카드 뉴스 등 사용자 참여형 포맷을 확대하면서, 뉴스 소비 데이터를 다시 제작 과정에 반영하는 순환 구조를 실험하고 있습니다.',
    createdAt: '2025-11-26T13:20:00',
    url: 'https://news.example.com/news-consumption',
    memos: [],
  },
];

export default function ScrapMyPage() {
  // (2) 초기값을 더미 데이터로 설정
  const initialScraps = USE_DUMMY_DATA ? DUMMY_SCRAPS : [];
  // 스크랩 목록
  const [scraps, setScraps] = useState(initialScraps);
  // 선택된 스크랩된 ID
  const [selectedScrapId, setSelectedScrapId] = useState(
    () => (USE_DUMMY_DATA ? initialScraps[0]?.id ?? null : null),
  );
  // 화면 중앙 뉴스 원문 영역 출력여부
  const [detailVisible, setDetailVisible] = useState(false);
  // API 로딩중 여부
  const [loading, setLoading] = useState(!USE_DUMMY_DATA); // ← API 모드일 땐 로딩 표시
  
  // 새 메모 입력창
  const [memoDraft, setMemoDraft] = useState('');
  // 메모 편집중 여부
  const [memoBusy, setMemoBusy] = useState(false);
  // 편집중일때 메모ID
  const [editingMemoId, setEditingMemoId] = useState(null);
  // 수정중 메모 내용
  const [editingContent, setEditingContent] = useState('');

  // 어떤 기사 메모를 수정 중인지(기사 ID)
  const [editingScrapId, setEditingScrapId] = useState(null);

  // 기사별 메모 접힘/펼침 상태
  const [articleMemosOpen, setArticleMemosOpen] = useState(true);

  // 마이페이지 메모 접힘/펼침 상태
  const [pageMemosOpen, setPageMemosOpen] = useState(true);

  // 마이페이지 전용 메모
  const [pageMemos, setPageMemos] = useState([]);
  const [pageMemoDraft, setPageMemoDraft] = useState('');

  // 평점(피드백) 모달
  const [ratingModal, setRatingModal] = useState({
    open: false,
    scrap: null,
    rating: 0,
    feedback: '',
  });
  const [ratingBusy, setRatingBusy] = useState(false);

  const [hoverRating, setHoverRating] = useState(0);

  // 배너
  const [banner, setBanner] = useState(null);
  // 현재 페이지 주소 정보
  const location = useLocation();
  // 이전 location.key 기억
  const locationKeyRef = useRef(location.key);

  // 모달 닫고 평점(피드백) 초기화
  const closeRatingModal = useCallback(() => {
    setRatingModal({
      open: false,
      scrap: null,
      rating: 0,
      feedback: '',
    });
    setHoverRating(0);
  }, []);
  // 평점 남기고 모달 열기
  const openRatingModal = useCallback((scrap) => {
    setRatingModal({
      open: true,
      scrap,
      rating: 0,
      feedback: '',
    });
  }, []);

  // 스크랩 객체 계산
  const selectedScrap = useMemo(
    () => scraps.find((scrap) => scrap.id === selectedScrapId) || null,
    [scraps, selectedScrapId],
  );

  // 모든 기사에 달린 메모를 한 리스트로 모으기
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

  // ESC 키로 모달 닫기
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
      setScraps(data);
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

  // 스크랩 선택 및 삭제
  const handleSelectScrap = (scrapId) => {
      // 이미 열려 있는 기사를 다시 클릭한 경우 → 초기화면으로 되돌리기
      if(selectedScrapId === scrapId && detailVisible) {
        setDetailVisible(false);      // 원문 영역 닫기
        setSelectedScrapId(null);    // 선택 해제 (아무 기사도 선택 안 한 상태)
        setMemoDraft('');
        setEditingMemoId(null);
        setEditingContent('');
        closeRatingModal();
        return;
      }

      // 평소에는 해당 기사 상세 보기로 전환
      setSelectedScrapId(scrapId);
      setDetailVisible(true);
      setMemoDraft('');
      setEditingMemoId(null);
      setEditingContent('');
      closeRatingModal();
    };
  // 스크랩 해제
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

  // 메모 편집
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
        prev.map((scrap) => (
          scrap.id === selectedScrap.id
            ? {
                ...scrap,
                memos: [...(scrap.memos || []), newMemo],
              }
            : scrap
        )),
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
    setEditingScrapId(targetScrapId);  // 어떤 기사 메모인지도 저장
    setEditingContent(memo.content);
  };
  // 수정모드 종료 + 초기화
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
              memo.id === editingMemoId
                ? { ...memo, content, updatedAt: now }
                : memo,
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
        scrapId: editingScrapId,               // 수정 중인 메모가 달린 기사 ID
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


  // 메모 삭제
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
  
 // 마이페이지 전용 메모 추가 (프론트 임시 저장)
  const handleAddPageMemo = () => {
    if (!pageMemoDraft.trim()) return;
    const now = new Date().toISOString();

    setPageMemos((prev) => [
      ...prev,
      {
        id: Date.now(),        // 간단한 임시 ID
        content: pageMemoDraft.trim(),
        createdAt: now,
      },
    ]);
    setPageMemoDraft('');
  };

  // 마이페이지 전용 메모 삭제
  const handleDeletePageMemo = (id) => {
    setPageMemos((prev) => prev.filter((memo) => memo.id !== id));
  };

  // 평점(피드백) 전송
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
  // 날짜 레이아웃 설정
  const formatDate = (value) => {
    if (!value) return '';
    return value.replace('T', ' ').slice(0, 16);
  };

  const layoutClass = selectedScrap && detailVisible
    ? 'scrap-page__grid scrap-page__grid--detail'
    : 'scrap-page__grid';

  return (
    <div className="scrap-page">
        <section className="scrap-page__hero">
          마이페이지
        </section>

      {banner && (
        <div className={`scrap-page__banner scrap-page__banner--${banner.type}`}>
          {banner.text}
        </div>
      )}

      <div className={layoutClass}>
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
                  className={`scrap-item ${selectedScrapId === scrap.id ? 'scrap-item--active' : ''}`}
                >
                  <button
                    type="button"
                    className="scrap-item__body"
                    onClick={() => handleSelectScrap(scrap.id)}
                  >
                    <h4>{scrap.title}</h4>
                    <p>{scrap.summary || '요약이 없습니다.'}</p>
                  </button>
                  <div className="scrap-item__footer">
                    <span className="scrap-item__date">{formatDate(scrap.createdAt)}</span>
                    <div className="scrap-item__actions">
                      
                      <button
                        type="button"
                        className="icon-button"
                        title="스크랩 삭제"
                        onClick={() => handleDeleteScrap(scrap.id)}
                      >
                        {/* 기본: 채워진 북마크 */}
                        <BookmarkIcon className="icon-filled" fontSize="small" />
                        {/* hover 시 보일 테두리 북마크 */}
                        <BookmarkBorderIcon className="icon-border" fontSize="small" />
                      </button>

                      <button
                        type="button"
                        className="icon-button"
                        title="평점 남기기"
                        onClick={() => openRatingModal(scrap)}
                      >
                        {/* 기본: 채워진 별 */}
                        <StarRateIcon className="icon-filled" fontSize="small" />
                        {/* hover 시 보일 테두리 별 */}
                        <StarBorderIcon className="icon-border" fontSize="small" />
                      </button>

                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {detailVisible && selectedScrap && (
          <section className="scrap-page__article">
            <header className="article-panel__header">
              <h3>뉴스 기사의 원문내용</h3>
              {selectedScrap.url && (
                <a href={selectedScrap.url} target="_blank" rel="noreferrer">
                  원문 보기
                </a>
              )}
            </header>
            <article className="article-panel">
              <h4>{selectedScrap.title}</h4>
              {selectedScrap.summary ? (
                <p className="article-panel__summary">{selectedScrap.summary}</p>
              ) : (
                <p className="article-panel__summary">요약 정보가 없습니다.</p>
              )}
              <div className="article-panel__original">
                <h5>전체 원문</h5>
                {selectedScrap.article ? (
                  selectedScrap.article
                    .replace(/\r/g, '')
                    .split('\n\n')
                    .filter((paragraph) => paragraph.trim().length > 0)
                    .map((paragraph, index) => (
                      <p key={`article-paragraph-${index}`}>
                        {paragraph.trim()}
                      </p>
                    ))
                ) : (
                  <p>원문을 불러올 수 없습니다.</p>
                )}
              </div>
            </article>
          </section>
        )}

        <section className="scrap-page__memo">
          <h2>메모장</h2>

          {detailVisible && selectedScrap ? (
            /* 기사 클릭된 상태: 해당 기사에 대한 메모만 보여주기 */
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
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows="3"
                          />
                          <div className="memo-card__actions">
                            <button type="button" onClick={handleCancelEdit}>취소</button>
                            <button type="button" onClick={handleUpdateMemo} disabled={memoBusy}>
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
                              <button type="button" onClick={() => handleStartEditMemo(memo)}>수정</button>
                              <button type="button" onClick={() => handleDeleteMemo(memo.id)}>삭제</button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="memo-form">
                <textarea
                  rows="4"
                  placeholder="이 기사에 대한 메모를 남겨보세요."
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleCreateMemo}
                  disabled={!memoDraft.trim() || memoBusy}
                >
                  {memoBusy ? '저장 중…' : '작성'}
                </button>
              </div>
            </>
          ) : (
            /* 초기 화면 (어떤 기사도 클릭하지 않은 상태)
              - 위: 모든 기사에 대한 메모 리스트 (읽기용)
              - 아래: 마이페이지 전용 메모
            */
            <>
              {/* 1) 전체 기사 메모 리스트 */}
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
                            {/* 여기서는 읽기 전용 */}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>


              {/* 2) 마이페이지 전용 메모 */}
              <div className="memo-section memo-section--page">
              <h4
                className="memo-section__title memo-section__title--clickable"
                onClick={() => setPageMemosOpen((prev) => !prev)}
              >
                마이페이지 메모
              </h4>

              {/* 리스트만 접힘/펼침 */}
              {pageMemosOpen && (
                <div className="memo-list">
                  {pageMemos.length === 0 ? (
                    <p className="scrap-page__placeholder">
                      마이페이지에서만 볼 수 있는 개인 메모를 남겨보세요.
                    </p>
                  ) : (
                    pageMemos.map((memo) => (
                      <div className="memo-card" key={memo.id}>
                        <p>{memo.content}</p>
                        <div className="memo-card__meta">
                          <span>{formatDate(memo.createdAt)}</span>
                          <div>
                            <button type="button" onClick={() => handleDeletePageMemo(memo.id)}>
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 입력 폼은 항상 표시 */}
              <div className="memo-form">
                <textarea
                  rows="4"
                  placeholder="메모를 남겨보세요."
                  value={pageMemoDraft}
                  onChange={(e) => setPageMemoDraft(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddPageMemo}
                  disabled={!pageMemoDraft.trim()}
                >
                  메모 추가
                </button>
              </div>
            </div>


            </>
          )}
        </section>

      </div>
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
                      {active ? <StarIcon fontSize="inherit" /> : <StarBorderIcon fontSize="inherit" />}
                    </button>
                  );
                })}
                <span className="rating-modal__score">
                  {ratingModal.rating || 0}/5
                </span>
              </div>
            </div>

            {/* 피드백 입력 영역은 그대로 유지 */}
            <label>
              AI 요약 피드백
              <textarea
                rows="4"
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
