// src/App.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PropTypes from 'prop-types';

import { getMe, doLogout, getNotifications, markNotificationRead } from './api/nuzipclientapi';

import Landing from './pages/landing';
import LoginHome from './pages/loginhome';
import NuzipLogin from './pages/login';
import LocalRegister from './pages/localregister';
import LocalRegisterCategories from './pages/localregistercategories';
import NuzipRegister from './pages/oauth2registercategories';
import OAuth2Success from './pages/oauth2success';
import RegisterChoice from './pages/registerchoice';

// ✅ 프로필 수정 페이지
import ProfileEditPage from './pages/profileedit';
import VerifyMePage from './pages/verifyme';
import ScrapMyPage from './pages/scrapmypage';
import NewsTestPage from './pages/newstest';

// 알림 아이콘
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import NotificationAddIcon from '@mui/icons-material/NotificationAdd';

// 🔹 상단 로고
import NuzipLogo from './pages/Nuzip_logo2.png';

export default function App() {
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [markingId, setMarkingId] = useState(null);
  const notificationRef = useRef(null);
  const unreadCount = notifications.length;

  const formatNotificationTime = (value) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      return '';
    }
  };

  const loadNotifications = useCallback(() => {
    if (!me?.authenticated) {
      setNotifications([]);
      return Promise.resolve([]);
    }
    setNotificationLoading(true);
    setNotificationError('');
    return getNotifications()
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : [];
        setNotifications(items);
        return items;
      })
      .catch((err) => {
        console.error('알림 조회 실패:', err);
        setNotificationError('알림을 불러오지 못했습니다.');
        return [];
      })
      .finally(() => setNotificationLoading(false));
  }, [me?.authenticated]);

  const handleToggleNotifications = () => {
    if (!notificationOpen) {
      loadNotifications();
    }
    setNotificationOpen((prev) => !prev);
  };

  const handleNotificationRead = async (notificationId) => {
    setMarkingId(notificationId);
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
      setNotificationError('알림 읽음 처리에 실패했습니다.');
    } finally {
      setMarkingId(null);
    }
  };

  const refreshMe = useCallback(() => {
    const stored = sessionStorage.getItem('jwt');
    if (!stored) {
      setMe(null);
      setChecking(false);
      return Promise.resolve(null);
    }
    setChecking(true);
    return getMe()
      .then((res) => setMe(res.data))
      .catch(() => setMe(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (!me?.authenticated) {
      setNotifications([]);
      setNotificationOpen(false);
    }
  }, [me?.authenticated]);

  useEffect(() => {
    if (!me?.authenticated) return;
    loadNotifications();
  }, [me?.authenticated, loadNotifications]);

  useEffect(() => {
    if (!notificationOpen) return;
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen]);

  const ProtectedRoute = ({ children }) => {
    if (checking) return <div style={{ padding: 24 }}>로딩 중…</div>;
    if (!me?.authenticated) return <Navigate to="/landing" replace />;
    return children;
  };
  ProtectedRoute.propTypes = { children: PropTypes.node.isRequired };

  const handleLogout = async () => {
    try {
      await doLogout();
    } catch (err) {
      console.error('로그아웃 실패:', err);
    }
    sessionStorage.removeItem('jwt');
    setNotifications([]);
    setNotificationOpen(false);
    setNotificationError('');
    setMarkingId(null);
    await refreshMe();
  };

  // 🔵 기본 링크 스타일: 배경 흰색, 선택 시 파란 글씨 + 옅은 칩 배경
  const linkStyle = ({ isActive }) => ({
    marginRight: 8,
    textDecoration: 'none',
    color: isActive ? '#2563eb' : '#4b5563',
    fontWeight: isActive ? 700 : 500,
    fontSize: 14,
    padding: '6px 10px',
    borderRadius: 999,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    backgroundColor: isActive ? 'rgba(37,99,235,0.08)' : 'transparent',
  });

  // 로고: 홈 역할 (비로그인: /landing, 로그인: /home)
  const logoLinkStyle = () => ({
    display: 'flex',
    alignItems: 'center',
    marginRight: 16,
    textDecoration: 'none',
  });

  const usernameLinkStyle = ({ isActive }) => ({
    marginLeft: 'auto',
    marginRight: 8,
    textDecoration: 'none',
    color: isActive ? '#2563eb' : '#374151',
    fontWeight: 700,
    fontSize: 14,
    padding: '6px 12px',
    borderRadius: 999,
    backgroundColor: isActive ? 'rgba(37,99,235,0.1)' : 'rgba(15,23,42,0.03)',
    border: '1px solid rgba(209,213,219,0.8)',
  });

  const logoutButtonStyle = {
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid rgba(37,99,235,0.4)',
    background: '#ffffff',
    color: '#2563eb',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  };

  const notificationWrapperStyle = {
    position: 'relative',
    marginLeft: 4,
    marginRight: 8,
  };

  const notificationButtonStyle = {
    width: 38,
    height: 36,
    borderRadius: 999,
    border: '1px solid rgba(209,213,219,0.8)',
    background: '#ffffff',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    padding: 0,
  };

  const notificationBadgeStyle = {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    background: '#ef4444',
    color: '#ffffff',
    fontSize: 11,
    lineHeight: '16px',
    textAlign: 'center',
    padding: '0 4px',
    fontWeight: 700,
  };

  const notificationPanelStyle = {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    right: 0,
    width: 320,
    maxHeight: 380,
    background: '#ffffff',
    border: '1px solid rgba(15,23,42,0.08)',
    borderRadius: 16,
    boxShadow: '0 12px 30px rgba(15,23,42,0.12)',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 30,
  };

  const notificationHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const notificationHeaderTitleStyle = {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
  };

  const notificationRefreshButtonStyle = {
    fontSize: 12,
    borderRadius: 999,
    padding: '4px 10px',
    border: '1px solid rgba(148,163,184,0.7)',
    background: '#ffffff',
    color: '#475569',
    cursor: 'pointer',
  };

  const notificationListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 260,
    overflowY: 'auto',
  };

  const notificationItemStyle = {
    borderRadius: 12,
    border: '1px solid rgba(226,232,240,0.9)',
    padding: '10px 12px',
    background: 'rgba(248,250,252,0.9)',
  };

  const notificationMessageStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 6,
  };

  const notificationMetaRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const notificationMetaStyle = {
    fontSize: 11,
    color: '#6b7280',
  };

  const notificationActionButtonStyle = {
    marginLeft: 'auto',
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid rgba(59,130,246,0.5)',
    background: '#ffffff',
    color: '#2563eb',
    cursor: 'pointer',
  };

  const notificationEmptyStyle = {
    width: '100%',
    padding: '12px 0',
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
  };

  const notificationErrorStyle = {
    fontSize: 12,
    color: '#dc2626',
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <nav
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid rgba(209,213,219,0.8)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            background: '#ffffff',          // 🔹 배경 흰색
            boxShadow: '0 6px 14px rgba(15,23,42,0.04)',
          }}
        >
          {/* 비로그인 상태 */}
          {!me?.authenticated ? (
            <>
              {/* 로고 = /landing (홈 역할) */}
              <NavLink to="/landing" style={logoLinkStyle}>
                <img
                  src={NuzipLogo}
                  alt="Nuzip"
                  style={{ height: 30, width: 'auto', display: 'block' }}
                />
              </NavLink>

              <NavLink to="/register-choice" style={linkStyle}>
                회원가입
              </NavLink>
              <NavLink to="/login" style={linkStyle}>
                로그인
              </NavLink>
            </>
          ) : (
            <>
              {/* 로고 = /home (홈 역할) / 🔹 텍스트 '홈' 버튼은 제거 */}
              <NavLink to="/home" style={logoLinkStyle}>
                <img
                  src={NuzipLogo}
                  alt="Nuzip"
                  style={{ height: 30, width: 'auto', display: 'block' }}
                />
              </NavLink>

              <NavLink to="/news/test" style={linkStyle}>
                뉴스 테스트
              </NavLink>
              <NavLink to="/scrap/mypage" style={linkStyle}>
                마이페이지
              </NavLink>

              <NavLink
                to="/profile/verify"
                style={usernameLinkStyle}
                title="내 정보 수정"
              >
                {(me?.username || me?.userId || '회원')} 님
              </NavLink>

              <div style={notificationWrapperStyle} ref={notificationRef}>
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  style={notificationButtonStyle}
                  aria-label="알림 열기"
                >
                  {/* 🔔 알림 없음 / 🔔+ 아이콘 알림 있음 */}
                  {unreadCount > 0 ? (
                    <NotificationAddIcon fontSize="small" style={{ color: '#2563eb' }} />
                  ) : (
                    <NotificationsNoneOutlinedIcon fontSize="small" style={{ color: '#2563eb' }} />
                  )}

                  {unreadCount > 0 && (
                    <span style={notificationBadgeStyle}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {notificationOpen && (
                  <div style={notificationPanelStyle}>
                    <div style={notificationHeaderStyle}>
                      <span style={notificationHeaderTitleStyle}>알림</span>
                      <button
                        type="button"
                        style={notificationRefreshButtonStyle}
                        onClick={loadNotifications}
                        disabled={notificationLoading}
                      >
                        {notificationLoading ? '불러오는 중' : '새로고침'}
                      </button>
                    </div>
                    {notificationError && (
                      <div style={notificationErrorStyle}>{notificationError}</div>
                    )}
                    <div style={notificationListStyle}>
                      {notificationLoading && notifications.length === 0 && (
                        <div style={notificationEmptyStyle}>불러오는 중…</div>
                      )}
                      {!notificationLoading && notifications.length === 0 && (
                        <div style={notificationEmptyStyle}>새로운 알림이 없습니다.</div>
                      )}
                      {notifications.map((notification) => (
                        <div key={notification.id} style={notificationItemStyle}>
                          <div style={notificationMessageStyle}>
                            {notification.message || '알림 내용이 없습니다.'}
                          </div>
                          <div style={notificationMetaRowStyle}>
                            <span style={notificationMetaStyle}>
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                            <button
                              type="button"
                              style={notificationActionButtonStyle}
                              onClick={() => handleNotificationRead(notification.id)}
                              disabled={markingId === notification.id}
                            >
                              {markingId === notification.id ? '처리 중' : '확인'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleLogout} style={logoutButtonStyle}>
                로그아웃
              </button>
            </>
          )}
        </nav>

        <Routes>
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
          <Route
            path="/register/categories"
            element={<LocalRegisterCategories onComplete={refreshMe} />}
          />

          {/* OAuth2 */}
          <Route path="/oauth2/success" element={<OAuth2Success />} />
          <Route
            path="/oauth2/register/categories"
            element={<NuzipRegister onComplete={refreshMe} />}
          />

          {/* 보호 페이지 */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <LoginHome me={me} />
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

          <Route
            path="/profile/verify"
            element={
              <ProtectedRoute>
                <VerifyMePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/scrap/mypage"
            element={
              <ProtectedRoute>
                <ScrapMyPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/news/test"
            element={
              <ProtectedRoute>
                <NewsTestPage />
              </ProtectedRoute>
            }
          />

          {/* 중복 정의는 그대로 두되, 내용 변경 없음 */}
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEditPage />
              </ProtectedRoute>
            }
          />

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