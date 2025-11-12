// 구글 OAuth2 로그인 성공 직후 토큰을 처리하는 중간 단계 페이지
// 토큰 수신/처리 페이지
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function OAuth2Success() {
  const nav = useNavigate();
  const { hash, search } = useLocation();

  useEffect(() => {
    let token = null;

    // 1) 해시(#token=...) 우선
    if (hash?.startsWith("#token=")) {
      const encoded = hash.substring("#token=".length);
      let decoded = decodeURIComponent(encoded); // "Bearer ey..."
      if (decoded.startsWith("Bearer+")) {
        decoded = decoded.replace("Bearer+", "Bearer ");
      }
      token = decoded;
    }

    // 2) 없으면 쿼리(?token=...) 시도
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
    if (!token) {
      nav("/login?error=missing_token", { replace: true });
      return;
    }

    (async () => {
      const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
      if (!raw) {
        nav("/login?error=invalid_token", { replace: true });
        return;
      }

      sessionStorage.setItem("jwt", raw);

      let nextPath = "/home";
      const pendingAfterLogin = sessionStorage.getItem("googleAfterLoginPath");

      try {
        const meRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${raw}`,
          },
        });

        if (meRes.ok) {
          const me = await meRes.json();
          sessionStorage.setItem("username", me.username || "");
          if (me.provider) {
            sessionStorage.setItem("provider", me.provider);
          }

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
          sessionStorage.removeItem("googleAfterLoginPath");
        }
        nav(nextPath, { replace: true });
      }
    })();
  }, [hash, search, nav]);

  return null;
}
