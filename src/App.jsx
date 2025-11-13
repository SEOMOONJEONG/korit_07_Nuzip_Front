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

  const refreshMe = useCallback(() => {
    const stored = sessionStorage.getItem('jwt');
    if (!stored) {
      setMe(null);
      setChecking(false);
      return Promise.resolve(null);
    }
    setChecking(true);
    return getMe()
      .then(res => setMe(res.data))
      .catch(() => setMe(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => { refreshMe(); }, [refreshMe]);

  const ProtectedRoute = ({ children }) => {
    if (checking) return <div style={{padding:24}}>로딩 중…</div>;
    if (!me?.authenticated) return <Navigate to="/landing" replace />;
    return children;
  };
  ProtectedRoute.propTypes = { children: PropTypes.node.isRequired };

  const handleLogout = async () => {
    try { await doLogout(); } catch (err) { console.error('로그아웃 실패:', err); }
    sessionStorage.removeItem('jwt');
    await refreshMe();
  };

  const linkStyle = ({ isActive }) => ({
    marginRight: 12,
    textDecoration: "none",
    color: isActive ? "#0a7" : "#333",
    fontWeight: isActive ? 700 : 500
  });

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <nav style={{ padding: 12, borderBottom: "1px solid #eee", display:'flex', gap:12, alignItems:'center' }}>
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
          {/* 기본 분기 */}
          <Route path="/" element={<Navigate to="/landing" replace />} />

          {/* 공개 페이지 */}
          <Route
            path="/landing"
            element={me?.authenticated ? <Navigate to="/home" replace /> : <Landing />}
          />
          <Route path="/register-choice" element={<RegisterChoice />} />
          <Route path="/login" element={<NuzipLogin afterLogin={refreshMe} />} />

          {/* 내부 회원가입 플로우 */}
          <Route path="/register" element={<LocalRegister />} />
          <Route path="/register/categories" element={<LocalRegisterCategories onComplete={refreshMe} />} />

          {/* OAuth2 */}
          <Route path="/oauth2/success" element={<OAuth2Success />} />
          <Route path="/oauth2/register/categories" element={<NuzipRegister onComplete={refreshMe} />} />

          {/* 보호 페이지 */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <LoginHome me={me} />
              </ProtectedRoute>
            }
          />

          {/* ✅ 프로필 수정 페이지 보호 라우트 추가 */}
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEditPage />
              </ProtectedRoute>
            }
          />

          {/*Routes에 보호 라우트 2개 추가*/}
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

          {/* 기타 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
