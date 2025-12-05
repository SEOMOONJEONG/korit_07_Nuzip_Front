import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import {
  getMe,
  doLogout,
  getNotifications,
  markNotificationRead,
  type AuthMeResponse,
  type NotificationDto,
} from './api/nuzipclientapi';

import UserHome from './pages/UserHome';
import NuzipLogin from './pages/login';
import LocalRegister from './pages/localregister';
import LocalRegisterCategories from './pages/localregistercategories';
import NuzipRegister from './pages/oauth2registercategories';
import OAuth2Success from './pages/oauth2success';
import RegisterChoice from './pages/registerchoice';
import Landing from './pages/landing';
import HomePage from './pages/HomePage';

// ✅ 프로필 수정 페이지
import ProfileEditPage from './pages/profileedit';
import VerifyMePage from './pages/verifyme';
import ScrapMyPage from './pages/scrapmypage';

// 알림 아이콘
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import NotificationAddIcon from '@mui/icons-material/NotificationAdd';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';

// 상단 로고
import NuzipLogo from './pages/Nuzip_logo2.png';

type ProtectedRouteProps = {
  children: ReactNode;
};

type NavLinkStyleArgs = {
  isActive: boolean;
};

export default function App() {
  const [me, setMe] = useState<AuthMeResponse | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [notificationOpen, setNotificationOpen] = useState<boolean>(false);
  const [notificationLoading, setNotificationLoading] = useState<boolean>(false);
  const [notificationError, setNotificationError] = useState<string>('');
  const [markingId, setMarkingId] = useState<NotificationDto['id'] | null>(null);
  const [markingSelected, setMarkingSelected] = useState<boolean>(false);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<NotificationDto['id'][]>([]);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = notifications.length;

  const formatNotificationTime = (value?: string | number | Date) => {
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

  const loadNotifications = useCallback((): Promise<NotificationDto[]> => {
    if (!me?.authenticated) {
      setNotifications([]);
      return Promise.resolve([]);
    }
    setNotificationLoading(true);
    setNotificationError('');
    return getNotifications()
      .then((res) => {
        const items = (Array.isArray(res.data) ? res.data : []) as NotificationDto[];
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

  const handleNotificationRead = async (notificationId: NotificationDto['id']) => {
    setMarkingId(notificationId);
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
      setSelectedNotificationIds((prev) => prev.filter((id) => id !== notificationId));
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
      setNotificationError('알림 읽음 처리에 실패했습니다.');
    } finally {
      setMarkingId(null);
    }
  };

  const toggleNotificationSelection = (notificationId: NotificationDto['id']) => {
    setSelectedNotificationIds((prev) =>
      prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId],
    );
  };

  const handleMarkSelectedNotificationsRead = async () => {
    if (!selectedNotificationIds.length) return;
    setMarkingSelected(true);
    try {
      await Promise.all(selectedNotificationIds.map((notificationId) => markNotificationRead(notificationId)));
      setNotifications((prev) => prev.filter((notification) => !selectedNotificationIds.includes(notification.id)));
      setSelectedNotificationIds([]);
    } catch (err) {
      console.error('선택 알림 읽음 처리 실패:', err);
      setNotificationError('선택한 알림 읽음 처리에 실패했습니다.');
    } finally {
      setMarkingSelected(false);
    }
  };

  const handleToggleSelectAllNotifications = () => {
    if (!notifications.length) return;
    const allSelected = selectedNotificationIds.length === notifications.length;
    if (allSelected) {
      setSelectedNotificationIds([]);
      return;
    }
    setSelectedNotificationIds(notifications.map((notification) => notification.id));
  };

  const refreshMe = useCallback((): Promise<AuthMeResponse | null> => {
    const stored = sessionStorage.getItem('jwt');
    if (!stored) {
      setMe(null);
      setChecking(false);
      return Promise.resolve(null);
    }
    setChecking(true);
    return getMe()
      .then((res) => {
        const payload = res.data as AuthMeResponse;
        setMe(payload);
        return payload;
      })
      .catch(() => {
        setMe(null);
        return null;
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (!me?.authenticated) {
      setNotifications([]);
      setNotificationOpen(false);
      setSelectedNotificationIds([]);
    }
  }, [me?.authenticated]);

  useEffect(() => {
    if (!me?.authenticated) return;
    loadNotifications();
  }, [me?.authenticated, loadNotifications]);

  useEffect(() => {
    setSelectedNotificationIds((prev) =>
      prev.filter((id) => notifications.some((notification) => notification.id === id)),
    );
  }, [notifications]);

  useEffect(() => {
    if (!notificationOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        event.target instanceof Node &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen]);

  const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    if (checking) return <div style={{ padding: 24 }}>로딩 중…</div>;
    if (!me?.authenticated) return <Navigate to="/landing" replace />;
    return children;
  };

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
  const linkStyle = ({ isActive }: NavLinkStyleArgs) => ({
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

  const usernameLinkStyle = ({ isActive }: NavLinkStyleArgs) => ({
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

  const notificationWrapperStyle: CSSProperties = {
    position: 'relative',
    marginLeft: 4,
    marginRight: 8,
  };

  const notificationButtonStyle: CSSProperties = {
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

  const notificationBadgeStyle: CSSProperties = {
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

  const navIconLinkStyle: CSSProperties = {
    ...notificationButtonStyle,
    textDecoration: 'none',
  };

  const notificationPanelStyle: CSSProperties = {
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

  const notificationHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const notificationHeaderTitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
  };

  const notificationRefreshButtonStyle: CSSProperties = {
    fontSize: 12,
    borderRadius: 999,
    padding: '4px 10px',
    border: '1px solid rgba(148,163,184,0.7)',
    background: '#ffffff',
    color: '#475569',
    cursor: 'pointer',
  };

  const notificationListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 260,
    overflowY: 'auto',
  };

  const notificationItemStyle: CSSProperties = {
    borderRadius: 12,
    border: '1px solid rgba(226,232,240,0.9)',
    padding: '10px 12px',
    background: 'rgba(248,250,252,0.9)',
  };

  const notificationMessageStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 6,
  };

  const notificationMetaRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const notificationMetaStyle: CSSProperties = {
    fontSize: 11,
    color: '#6b7280',
  };

  const notificationActionButtonStyle: CSSProperties = {
    marginLeft: 'auto',
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid rgba(59,130,246,0.5)',
    background: '#ffffff',
    color: '#2563eb',
    cursor: 'pointer',
  };

  const notificationEmptyStyle: CSSProperties = {
    width: '100%',
    padding: '12px 0',
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
  };

  const notificationErrorStyle: CSSProperties = {
    fontSize: 12,
    color: '#dc2626',
  };

  const loginIconLinkStyle = () => ({
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
  });

  const loginIconButtonStyle: CSSProperties = {
    width: 40,
    height: 38,
    borderRadius: 999,
    border: '1px solid rgba(37,99,235,0.5)',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 6px 12px rgba(37,99,235,0.15)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  const navLogoLinkStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    marginRight: 12,
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

  const NavBar = () => {
    const location = useLocation();
    const isUserHomeRoute = location.pathname === '/home';
    const isPublicHomeRoute = location.pathname === '/';
    const isLandingRoute = location.pathname === '/landing';
    const showNavLogo = !isUserHomeRoute;
    const logoTarget = me?.authenticated ? '/home' : '/home-feed';

  return (
        <nav
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid rgba(209,213,219,0.8)',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          background: '#ffffff',
            boxShadow: '0 6px 14px rgba(15,23,42,0.04)',
          }}
        >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          {showNavLogo && (
            <NavLink to={logoTarget} style={navLogoLinkStyle} aria-label="홈으로 이동">
              <img src={NuzipLogo} alt="Nuzip" style={{ height: 30, width: 'auto', display: 'block' }} />
            </NavLink>
          )}
        </div>

          {/* 비로그인 상태 */}
          {!me?.authenticated ? (
              <NavLink to="/login" style={loginIconLinkStyle} aria-label="로그인" title="로그인">
                <span style={loginIconButtonStyle}>
                  <PermIdentityOutlinedIcon fontSize="small" style={{ color: '#2563eb' }} />
                </span>
              </NavLink>
          ) : (
            <>
              <NavLink
                to="/profile/verify"
                style={usernameLinkStyle}
                title="내 정보 수정"
              >
                {(me?.username || me?.userId || '회원')} 님
              </NavLink>

              <NavLink to="/scrap/mypage" style={navIconLinkStyle} title="마이페이지">
                <NoteAltOutlinedIcon fontSize="small" style={{ color: '#2563eb' }} />
              </NavLink>

              <div style={notificationWrapperStyle} ref={notificationRef}>
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  style={notificationButtonStyle}
                  aria-label="알림 열기"
                >
                {/* 알림 아이콘 */}
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
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          style={notificationRefreshButtonStyle}
                          onClick={loadNotifications}
                          title="알림 새로고침"
                          disabled={notificationLoading}
                        >
                          <AutorenewOutlinedIcon
                            fontSize="small"
                            style={{ color: '#2563eb', opacity: notificationLoading ? 0.6 : 1 }}
                          />
                        </button>
                        <button
                          type="button"
                          style={notificationRefreshButtonStyle}
                          onClick={handleToggleSelectAllNotifications}
                          title={
                            selectedNotificationIds.length === notifications.length
                              ? '전체 선택 해제'
                              : '전체 선택'
                          }
                          disabled={notificationLoading || notifications.length === 0}
                        >
                          <CheckBoxOutlinedIcon
                            fontSize="small"
                            style={{
                              color:
                                selectedNotificationIds.length === notifications.length
                                  ? '#2563eb'
                                  : '#94a3b8',
                            }}
                          />
                        </button>
                      <button
                        type="button"
                        style={notificationRefreshButtonStyle}
                        onClick={handleMarkSelectedNotificationsRead}
                        title="선택한 알림 읽음 처리"
                        disabled={
                          markingSelected ||
                          notificationLoading ||
                          selectedNotificationIds.length === 0
                        }
                      >
                        <MarkEmailReadOutlinedIcon
                          fontSize="small"
                          style={{ color: '#2563eb', opacity: markingSelected ? 0.6 : 1 }}
                        />
                      </button>
                      </div>
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
                      {notifications.map((notification) => {
                        const checked = selectedNotificationIds.includes(notification.id);
                        return (
                          <div key={notification.id} style={notificationItemStyle}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleNotificationSelection(notification.id)}
                                style={{ marginTop: 4 }}
                              />
                              <div style={{ flex: 1 }}>
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
                            </div>
                          </div>
                        );
                      })}
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
    );
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={me?.authenticated ? <Navigate to="/home" replace /> : <Landing />} />
          <Route path="/home-feed" element={<HomePage />} />

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
                <UserHome />
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