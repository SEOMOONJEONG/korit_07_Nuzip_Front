// 구글 OAuth2 로그인 성공 직후 토큰을 처리하는 중간 단계 페이지
// 토큰 수신/처리 페이지
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function OAuth2Success() {
  // 초기화
  const nav = useNavigate();
  const { hash, search } = useLocation();

  // 토큰 추출 로직 실행
  useEffect(() => {
    // 에러 쿼리 파라미터 확인
    if (search) {
      const params = new URLSearchParams(search);
      const error = params.get("error");
      const message = params.get("message");
      if (error) {
        console.error("OAuth 인증 오류:", error, message);
        alert(message || "OAuth 인증 중 오류가 발생했습니다.");
        nav("/login?error=oauth_failed", { replace: true });
        return;
      }
    }

    let token = null;

    // 1) 해시(#token=...) 우선 _ 토큰 추출
    if (hash?.startsWith("#token=")) {
      const encoded = hash.substring("#token=".length);
      let decoded = decodeURIComponent(encoded); // "Bearer ey..."
      if (decoded.startsWith("Bearer+")) {
        decoded = decoded.replace("Bearer+", "Bearer ");
      }
      token = decoded;
    }

    // 2) 없으면 쿼리(?token=...) 시도 해시에 토큰 없을경우 쿼리에서도 추출
    if (!token && search) {
      const p = new URLSearchParams(search);
      const t = p.get("token");
      if (t) {
        let decoded = decodeURIComponent(t);
        if (decoded.startsWith("Bearer+")) {
          decoded = decoded.replace("Bearer+", "Bearer ");
        }
        token = decoded;
      }
    }

    // 실패 처리  
    // 토큰이 없을때 로그인 화면으로 리다이렉트
    if (!token) {
      nav("/login?error=missing_token", { replace: true });
      return;
    }
    
    // 토큰이 있으면 세션에 저장하고 사용자 정보 확인
    (async () => {
      const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
      if (!raw) {
        nav("/login?error=invalid_token", { replace: true });
        return;
      }
      sessionStorage.setItem("jwt", raw);

      let nextPath = "/home";
      const pendingAfterLogin = sessionStorage.getItem("oauthAfterLoginPath");

      // /api/auth/me 호출해서 사용자 정보 확인
      // JWT 토큰 전송하여 유효한 사용자 정보인지 확인
      try {
        const meRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${raw}`,
          },
        });

        // 응답 결과에 따라 이동 경로 결정
        if (meRes.ok) { // user구분 (OAUTH_GOOGLE)
          const me = await meRes.json();
          sessionStorage.setItem("username", me.username || "");
          if (me.provider) {
            sessionStorage.setItem("provider", me.provider);
          }

          // 카테고리 미선택 된 유저일 경우 카테고리 선택 화면으로 이동
          if (me.needsCategorySelection) {
            nextPath = "/oauth2/register/categories";
          } else if (pendingAfterLogin) {
            nextPath = pendingAfterLogin;
          }
        } else {
          nextPath = "/oauth2/register/categories";
        }
      } catch (err) {
        console.warn("Failed to load /api/auth/me after google login:", err);
      } finally {
        if (pendingAfterLogin) {
          sessionStorage.removeItem("oauthAfterLoginPath");
        }
        nav(nextPath, { replace: true });
      }
    })();
  }, [hash, search, nav]);

  return null;
}
