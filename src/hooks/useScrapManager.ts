import { useCallback, useEffect, useState } from 'react';
import {
  createScrap,
  getMyScraps,
  removeScrap,
  submitRating,
  type ScrapDto,
} from '../api/nuzipclientapi';
import type { UiNews } from '../types/news';
import {
  buildScrapPayload,
  cacheScrapImage,
  getArticleKey,
  getArticleKeyFromScrap,
  getScrapKey,
  withCachedScrapImage,
} from '../utils/scrap';

type RatingModalState = {
  open: boolean;
  scrap?: ScrapDto;
  article?: UiNews;
};

type UseScrapManagerOptions = {
  enabled?: boolean;
};

export const useScrapManager = ({ enabled = true }: UseScrapManagerOptions = {}) => {
  const [scrapMap, setScrapMap] = useState<Record<string, ScrapDto>>({});
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});
  const [loadingScraps, setLoadingScraps] = useState(false);
  const [message, setMessage] = useState('');
  const [ratingModal, setRatingModal] = useState<RatingModalState>({ open: false });
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingBusy, setRatingBusy] = useState(false);

  const refreshScraps = useCallback(async () => {
    if (!enabled || !sessionStorage.getItem('jwt')) {
      setScrapMap({});
      return;
    }

    setLoadingScraps(true);
    try {
      const { data } = await getMyScraps();
      const map: Record<string, ScrapDto> = {};
      (Array.isArray(data) ? data : []).forEach((scrap) => {
        const normalized = withCachedScrapImage(scrap);
        const articleKey = getArticleKeyFromScrap(normalized);
        if (articleKey) {
          map[articleKey] = normalized;
        }
        const scrapKey = getScrapKey(normalized);
        if (scrapKey) {
          map[scrapKey] = normalized;
        }
      });
      setScrapMap(map);
    } catch (error) {
      console.error('스크랩 목록 로딩 실패', error);
      setScrapMap({});
      setMessage('즐겨찾기 정보를 불러오지 못했습니다.');
    } finally {
      setLoadingScraps(false);
    }
  }, [enabled]);

  useEffect(() => {
    refreshScraps();
  }, [refreshScraps]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const ensureScrapForArticle = useCallback(
    async (article: UiNews, key: string): Promise<ScrapDto | null> => {
      const existing = scrapMap[key];
      if (existing) return existing;
      const payload = buildScrapPayload(article);
      cacheScrapImage(payload.url, article.imageUrl);
      const response = await createScrap(payload);
      const created = (response?.data as ScrapDto) || null;
      if (created) {
        const decorated = withCachedScrapImage(created, article.imageUrl);
        const articleKeyFromScrap = getArticleKeyFromScrap(decorated);
        setScrapMap((prev) => ({
          ...prev,
          ...(articleKeyFromScrap ? { [articleKeyFromScrap]: decorated } : {}),
          ...(key ? { [key]: decorated } : {}),
          ...(getScrapKey(decorated) ? { [getScrapKey(decorated)]: decorated } : {}),
        }));
      } else {
        await refreshScraps();
      }
      return created;
    },
    [scrapMap, refreshScraps],
  );

  const toggleScrap = useCallback(
    async (article: UiNews) => {
      if (!enabled) {
        setMessage('로그인 후 이용할 수 있는 기능입니다.');
        return;
      }
      const key = getArticleKey(article);
      if (!key) {
        setMessage('이 기사에는 즐겨찾기를 적용할 수 없습니다.');
        return;
      }
      if (busyMap[key]) return;

      setBusyMap((prev) => ({ ...prev, [key]: true }));
      const existing = scrapMap[key];

      try {
        if (existing) {
          await removeScrap(existing.id);
          setMessage('즐겨찾기에서 제거했습니다.');
        } else {
          await ensureScrapForArticle(article, key);
          setMessage('즐겨찾기에 추가했습니다.');
        }
        await refreshScraps();
      } catch (error) {
        console.error('즐겨찾기 처리 실패', error);
        setMessage('즐겨찾기 처리에 실패했습니다.');
      } finally {
        setBusyMap((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [enabled, scrapMap, busyMap, refreshScraps, ensureScrapForArticle],
  );

  const openRatingModal = useCallback(
    (article: UiNews) => {
      if (!enabled) {
        setMessage('로그인 후 이용할 수 있는 기능입니다.');
        return;
      }
      const key = getArticleKey(article);
      if (!key) {
        setMessage('이 기사에는 즐겨찾기를 적용할 수 없습니다.');
        return;
      }
      const scrap = scrapMap[key];
      if (!scrap) {
        setMessage('먼저 스크랩한 후 별점을 남겨주세요.');
        return;
      }
      setRatingModal({ open: true, scrap, article });
      setRatingValue(0);
      setRatingFeedback('');
    },
    [enabled, scrapMap],
  );

  const closeRatingModal = useCallback(() => {
    setRatingModal({ open: false });
    setRatingValue(0);
    setRatingFeedback('');
  }, []);

  const submitRatingForCurrent = useCallback(async () => {
    if (!ratingModal.scrap) return;
    if (!ratingValue) {
      setMessage('별점을 먼저 선택해 주세요.');
      return;
    }
    setRatingBusy(true);
    try {
      await submitRating({
        scrapId: ratingModal.scrap.id,
        rating: ratingValue,
        feedback: ratingFeedback.trim(),
        sendToGemini: false,
      });
      setMessage('별점을 남겼습니다.');
      closeRatingModal();
    } catch (error) {
      console.error('별점 전송 실패', error);
      setMessage('별점 전송에 실패했습니다.');
    } finally {
      setRatingBusy(false);
    }
  }, [ratingModal.scrap, ratingValue, ratingFeedback, closeRatingModal]);

  return {
    enabled,
    scrapMap,
    busyMap,
    loadingScraps,
    message,
    setMessage,
    toggleScrap,
    openRating: openRatingModal,
    closeRating: closeRatingModal,
    ratingModal,
    ratingValue,
    setRatingValue,
    ratingFeedback,
    setRatingFeedback,
    ratingBusy,
    submitRating: submitRatingForCurrent,
    refreshScraps,
  };
};

export type ScrapManager = ReturnType<typeof useScrapManager>;

