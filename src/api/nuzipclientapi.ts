import axios, { type AxiosRequestHeaders, type AxiosResponse } from 'axios';

// ✅ 백엔드 기본 주소 (.env에서 가져옴)
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

// ✅ 공통 axios 인스턴스 생성
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,                 // JSESSIONID 쿠키 왕복
  headers: { 'Content-Type': 'application/json' },
});

// ✅ 요청 인터셉터: 저장된 토큰을 Authorization에 자동 첨부
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('jwt');
  if (token) {
    const bearerToken = token.trim().startsWith('Bearer ')
      ? token.trim()
      : `Bearer ${token.trim()}`;
    if (!config.headers) {
      config.headers = {} as AxiosRequestHeaders;
    }
    (config.headers as AxiosRequestHeaders).Authorization = bearerToken;
  }
  console.log('[Request Authorization]', config.headers.Authorization); // ← 여기 추가
  return config;
});

// ✅ 401 처리(선택): 토큰 제거/리다이렉트 등 인증 만료 처리
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn('JWT 만료 또는 인증 실패 → 토큰 삭제');
      sessionStorage.removeItem('jwt');
      // 필요하면 여기서 /login으로 보내기
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export type AuthMeResponse = {
  authenticated?: boolean;
  username?: string;
  userId?: string;
  [key: string]: unknown;
};

export type CategoryKey = string;

export type NewsArticle = {
  id?: number;
  title?: string;
  summary?: string;
  keywords?: string;
  originalLink?: string;
  url?: string;
  category?: string;
  [key: string]: unknown;
};

export type MemoDto = {
  id: number;
  scrapId?: number;
  content: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ScrapDto = {
  id: number;
  title: string;
  url?: string;
  summary?: string;
  article?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  memos?: MemoDto[];
};

export type NotificationDto = {
  id: number | string;
  message?: string;
  createdAt?: string;
};

export type ScrapPayload = {
  title: string;
  url: string;
  summary?: string;
  imageUrl?: string;
};

export type MemoPayload = {
  scrapId: number;
  content: string;
};

export type RatingPayload = {
  scrapId: number;
  rating: number;
  feedback?: string;
  sendToGemini?: boolean;
};

type PaginationParams = {
  page?: number;
  size?: number;
};

type GoogleLoginOptions = {
  purpose?: string;
  redirectPath?: string;
  forceReauth?: boolean;
};



// ✅ 아이디/비밀번호 로그인
export async function login({
  userId,
  password,
}: {
  userId: string;
  password: string;
}): Promise<string> {
  const res = await api.post('/login', { userId, password });
  // JWT는 Authorization 헤더로 온다고 가정
  const jwt = res.headers.authorization || res.headers.Authorization;
  if (!jwt) throw new Error('Authorization 헤더가 없습니다.');
  return jwt; // 'Bearer ...'
}

// ✅ 회원가입
// 백엔드: POST /api/auth/register
// body: { userId, password, username, phone, ... }
export async function register(userData: Record<string, unknown>) {
  return api.post('/api/auth/register', userData);
}

// ✅ 이메일 인증 메일 발송
export async function sendEmailVerification(email: string) {
  return api.post('/api/auth/email/verification/send', { email });
}

// ✅ 이메일 인증 코드 확인
export async function confirmEmailVerification({
  email,
  code,
}: {
  email: string;
  code: string;
}) {
  return api.post('/api/auth/email/verification/confirm', { email, code });
}

// ✅ 구글 로그인 (OAuth2 서버 처리)
// 백엔드가 idToken을 받아 JWT를 반환한다고 가정
export async function authenticateWithGoogleToken(idToken: string): Promise<string> {
  const res = await api.post('/api/auth/google', { idToken });
  const jwt = res.headers.authorization || res.headers.Authorization;
  if (!jwt) throw new Error('Authorization 헤더가 없습니다.');
  return jwt;
}


// 로그인 상태 확인 (스프링 컨트롤러의 /api/auth/me 가정)
export const getMe = () => api.get<AuthMeResponse>('/api/auth/me');

// 로그아웃 (스프링 기본 엔드포인트)
export const doLogout = () => api.post('/logout');

// 구글 OAuth2 시작 (스프링 시큐리티 기본 엔드포인트)
export const goGoogleLogin = (options: GoogleLoginOptions = {}) => {
  const params = new URLSearchParams();
  if (options.purpose) params.set('purpose', options.purpose);
  if (options.redirectPath) params.set('redirect', options.redirectPath);
  if (options.forceReauth) params.set('forceReauth', '1');
  const suffix = params.toString() ? `?${params.toString()}` : '';
  window.location.href = `${API_BASE}/oauth2/authorization/google${suffix}`;
};

// ✅ 최신 뉴스 기사 목록
export const fetchLatestNews = ({ page = 0, size = 10 }: PaginationParams = {}) =>
  api.get<NewsArticle[]>('/api/news', { params: { page, size } });

// ✅ 카테고리별 뉴스 기사 목록
export const fetchNewsByCategory = (
  categoryName: string,
  { page = 0, size = 10 }: PaginationParams = {}
) => {
  if (!categoryName) {
    throw new Error('categoryName 파라미터가 필요합니다.');
  }
  return api.get<NewsArticle[]>(`/api/news/category/${encodeURIComponent(categoryName)}`, {
    params: { page, size },
  });
};

// ✅ 현재 사용자 관심 카테고리 조회
export const getMyCategories = async () => {
  const { data } = await api.get<CategoryKey[] | { categories?: CategoryKey[] }>(
    '/api/users/me/categories'
  );
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
};

// ✅ 관심 카테고리 저장 (정확히 3개 키 전달)
export async function saveMyCategories(categories: CategoryKey[]) {
  // categories: ["POLITICS","IT_SCIENCE","WORLD"]
  const res = await api.post('/api/users/me/categories', { categories });
  return res.data;
}

export function isValidEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ========================== 컨텐츠 (스크랩/메모/평점) ==========================

export const getMyScraps = () => api.get<ScrapDto[]>('/api/content/scrap');

export const removeScrap = (scrapId: number | string) =>
  api.delete(`/api/content/scrap/${scrapId}`);

export const createScrap = ({ title, url, summary }: ScrapPayload) =>
  api.post<ScrapDto>('/api/content/scrap', { title, url, summary });

export const createMemo = (payload: MemoPayload) => api.post<MemoDto>('/api/content/memo', payload);

export const updateMemo = (memoId: number | string, payload: MemoPayload) =>
  api.put<MemoDto>(`/api/content/memo/${memoId}`, payload);

export const deleteMemo = (memoId: number | string) => api.delete(`/api/content/memo/${memoId}`);

export const submitRating = ({ scrapId, rating, feedback, sendToGemini = false }: RatingPayload) =>
  api.post('/api/content/rating', { scrapId, rating, feedback, sendToGemini });

// ========================== 알림 ==========================

export const getNotifications = () => api.get<NotificationDto[]>('/api/notifications');

export const markNotificationRead = (notificationId: NotificationDto['id']) =>
  api.post(`/api/notifications/${notificationId}/read`);