// src/App.jsx
import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PropTypes from 'prop-types';

import { getMe, doLogout } from './api/nuzipclientapi';

import Landing from './pages/landing';
import LoginHome from './pages/loginhome';
import NuzipLogin from './pages/login';
import LocalRegister from './pages/localregister';
import LocalRegisterCategories from './pages/localregistercategories';
import NuzipRegister from './pages/oauth2registercategories';
import OAuth2Success from './pages/oauth2success';
import RegisterChoice from './pages/registerchoice';

// ✅ 프로필 수정 페이지 추가 임포트
import ProfileEditPage from './pages/profileedit';
import VerifyMePage from './pages/verifyme';

export default function App() {
  const [me, setMe] = useState(null);     // { authenticated, userId, ... } | null
  const [checking, setChecking] = useState(true);
  // 로그인 상태 갱신 함수 `refreshMe`
  const refreshMe = useCallback(() => {
    const stored = sessionStorage.getItem('jwt');
    if (!stored) {
      setMe(null);
      setChecking(false);
      return Promise.resolve(null);
    }
    // jwt 있으면 서버로 현재 유저 정보 요청
    setChecking(true);
    return getMe()
      .then(res => setMe(res.data))
      .catch(() => setMe(null))
      .finally(() => setChecking(false));
  }, []);
  // 컴포넌트 마운트 시 한 번 로그인 상태 확인
  // 페이지 새로고침 후에도 sessionStorage에 jwt가 있따면
  // 다시 getMe() 호출해서 로그인 여부 복원
  useEffect(() => { refreshMe(); }, [refreshMe]);
  
  // 보호 라우트 컴포넌트 `ProtectedRoute`
  // 로그인 된 사용자만 볼 수 있음을 보장
  const ProtectedRoute = ({ children }) => {
    // checking = true → getMe() 검사중이니까 페이지 대신 `로딩 중` 문구 표시
    if (checking) return <div style={{padding:24}}>로딩 중…</div>;

    // 검사 끝났는데 !me?.authenticated = false or null → 로그인 안 된 상태 → 비로그인 메인화면 출력
    if (!me?.authenticated) return <Navigate to="/landing" replace />;
    return children;
  };
  ProtectedRoute.propTypes = { children: PropTypes.node.isRequired };

  // 로그아웃 처리
  // doLogout() 호출하여 서버에 로그아웃 요청
  const handleLogout = async () => {
    try { await doLogout(); } catch (err) { console.error('로그아웃 실패:', err); }
    // 로컬에서 sessionStorage에 있는 jwt 제거
    sessionStorage.removeItem('jwt');
    await refreshMe();
  };

  // NavLink 공통 스타일 함수
  // NavLink가 활성 경로인지에 따라 색 / 두께를 바꿔주는 함수
  const linkStyle = ({ isActive }) => ({
    marginRight: 12,
    textDecoration: "none",
    color: isActive ? "#0a7" : "#333",
    fontWeight: isActive ? 700 : 500
  });

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // JSX 반환부 전체 구조
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <nav style={{ padding: 12, borderBottom: "1px solid #eee", display:'flex', gap:12, alignItems:'center' }}>
          {/* 비로그인 상태 */}
          {!me?.authenticated ? (
            <>
              <NavLink to="/landing" style={linkStyle}>홈</NavLink>
              <NavLink to="/register-choice" style={linkStyle}>회원가입</NavLink>
              <NavLink to="/login" style={linkStyle}>로그인</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/home" style={linkStyle}>홈</NavLink>

              {/* ✅ 우측 사용자 이름을 클릭하면 /profile/verify로 이동 */}
              <NavLink
                to="/profile/verify"
                style={({ isActive }) => ({
                  marginLeft: 'auto',
                  marginRight: 8,
                  textDecoration: 'none',
                  color: isActive ? "#0a7" : "#333",
                  fontWeight: 700
                })}
                title="내 정보 수정"
              >
                {me.userId} 님
              </NavLink>

              <button onClick={handleLogout}>로그아웃</button>
            </>
          )}
        </nav>

        <Routes>
          {/* 기본 분기 : /루트로 진입 시 자동으로 `/landing` 으로 리다이렉트*/}
          <Route path="/" element={<Navigate to="/landing" replace />} />

          {/* 공개 페이지 */}
          {/* 로그인 여부 판단하여 로그인 돼 있으면 /home , 아니면 /landing */}
          <Route
            path="/landing"
            element={me?.authenticated ? <Navigate to="/home" replace /> : <Landing />}
          />
          <Route path="/register-choice" element={<RegisterChoice />} />
          <Route path="/login" element={<NuzipLogin afterLogin={refreshMe} />} />

          {/* 내부 회원가입 플로우 */}
          {/* 기본 정보 입력 페이지 */}
          <Route path="/register" element={<LocalRegister />} />
          {/* 뉴스 카테고리 선택 페이지 → nComplete={refreshMe} 호출하여 로그인 상태 갱신 */}
          <Route path="/register/categories" element={<LocalRegisterCategories onComplete={refreshMe} />} />

          {/* OAuth2 */}
          {/* 구글에서 로그인 성공 후 돌아오는 중간 처리 페이지 */}
          <Route path="/oauth2/success" element={<OAuth2Success />} />

          {/* 구글 로그인 후 첫 가입 시 카테고리 선택하는 화면 */}
          <Route path="/oauth2/register/categories" element={<NuzipRegister onComplete={refreshMe} />} />

          {/* 보호 페이지 (로그인 필수) */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <LoginHome me={me} />
              </ProtectedRoute>
            }
          />

          {/* ✅ 프로필 수정 페이지 보호 라우트 추가 */}
          {/* 프로필 관련 보호 라우트 */}
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEditPage />
              </ProtectedRoute>
            }
          />

          {/*Routes에 보호 라우트 2개 추가*/}
          {/* 비밀번호 재 확인 / 로그인 된 사용자만 접근 가능 */}
          <Route
            path="/profile/verify"
            element={
              <ProtectedRoute>
                <VerifyMePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEditPage />
              </ProtectedRoute>
            }
          />

          {/* 기타 (catch-all) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

/*
  전체 흐름
  1. 앱 시작
    - App 렌더 → useEffect에서 refreshMe() 실행 → sessionStorage에 jwt 확인 → 있으면 getMe()로 로그인 상태 가져옴
  2. checking = true(checking 할 동안) 보호라우트에서 "로딩 중..." 표시
  3. 로그인 여부에 따라
    - 네비게이션 메뉴(로그인/회원가입 vs 홈/프로필/로그아웃)가 달라짐
    = /home , /profile/* 같은 URL 접근 가능 여부가 달라짐
  4. 로그인/회원가입/카테고리 등록이 끝날 때 마다 refreshMe()를 콜백으로 받아서 호출 → me 상태 업데이트
  5. 로그아웃 버튼 누르면
    - 서버에 로그아웃 요청 → 로컬 JWT 삭제 → 다시 refreshMe() → 비로그인 상태로 UI 변경

*/