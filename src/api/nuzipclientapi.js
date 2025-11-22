import axios from 'axios';

// ✅ 백엔드 기본 주소 (.env에서 가져옴)
const API_BASE = import.meta.env.VITE_API_BASE_URL;

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
    // 토큰이 이미 "Bearer "로 시작하면 그대로 사용, 아니면 추가
    const bearerToken = token.trim().startsWith('Bearer ') ? token.trim() : `Bearer ${token.trim()}`;
    config.headers.Authorization = bearerToken;
  }
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



// ✅ 아이디/비밀번호 로그인
export async function login({ userId, password }) {
  const res = await api.post('/login', { userId, password });
  // JWT는 Authorization 헤더로 온다고 가정
  const jwt = res.headers.authorization || res.headers.Authorization;
  if (!jwt) throw new Error('Authorization 헤더가 없습니다.');
  return jwt; // 'Bearer ...'
}

// ✅ 회원가입
// 백엔드: POST /api/auth/register
// body: { userId, password, username, phone, ... }
export async function register(userData) {
  return api.post('/api/auth/register', userData);
}

// ✅ 이메일 인증 메일 발송
export async function sendEmailVerification(email) {
  return api.post('/api/auth/email/verification/send', { email });
}

// ✅ 이메일 인증 코드 확인
export async function confirmEmailVerification({ email, code }) {
  return api.post('/api/auth/email/verification/confirm', { email, code });
}

// ✅ 구글 로그인 (OAuth2 서버 처리)
// 백엔드가 idToken을 받아 JWT를 반환한다고 가정
export async function authenticateWithGoogleToken(idToken) {
  const res = await api.post('/api/auth/google', { idToken });
  const jwt = res.headers.authorization || res.headers.Authorization;
  if (!jwt) throw new Error('Authorization 헤더가 없습니다.');
  return jwt;
}


// 로그인 상태 확인 (스프링 컨트롤러의 /api/auth/me 가정)
export const getMe = () => api.get('/api/auth/me');

// 로그아웃 (스프링 기본 엔드포인트)
export const doLogout = () => api.post('/logout');

// 구글 OAuth2 시작 (스프링 시큐리티 기본 엔드포인트)
export const goGoogleLogin = (options = {}) => {
  const params = new URLSearchParams();
  if (options.purpose) params.set('purpose', options.purpose);
  if (options.redirectPath) params.set('redirect', options.redirectPath);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  window.location.href = `${API_BASE}/oauth2/authorization/google${suffix}`;
};

// ✅ 관심 카테고리 저장 (정확히 3개 키 전달)
export async function saveMyCategories(categories) {
  // categories: ["POLITICS","IT_SCIENCE","WORLD"]
  const res = await api.post('/api/users/me/categories', { categories });
  return res.data;
}

export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
