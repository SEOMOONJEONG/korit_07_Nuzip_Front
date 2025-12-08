// src/pages/verifyme.jsx
import { useEffect, useState } from "react";
import { goGoogleLogin } from "../api/nuzipclientapi";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export default function VerifyMePage() {
  const [provider, setProvider] = useState("LOCAL"); // ← 상태 선언
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const rawToken = sessionStorage.getItem("jwt");

  // 1) 내 정보 로드 → provider 상태에 반영
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const meRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${rawToken}`
          }
        });
        if (!meRes.ok) throw new Error("내 정보 조회 실패");
        const me = await meRes.json();
        setProvider(me.provider || "LOCAL"); // ✅ provider 상태 설정
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [rawToken]);

  // 2) provider 값을 "읽어" 사용: LOCAL이 아니면 바로 edit로 이동
  useEffect(() => {
    if (!loading && provider !== "LOCAL") {
      sessionStorage.setItem("oauthAfterLoginPath", "/profile/edit");

      // 네이버 제거 → 오직 구글만 사용
      goGoogleLogin({
        purpose: "profile-edit",
        redirectPath: "/profile/edit",
        forceReauth: true,
      });
    }
  }, [loading, provider]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const res = await fetch(`${API_BASE}/api/users/me/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${rawToken}`
        },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        const t = await safeJson(res);
        throw new Error(t?.message || "비밀번호가 일치하지 않습니다.");
      }
      const data = await res.json(); // { verified, reverifyToken, expiresAt } 가정
      if (!data.verified || !data.reverifyToken) {
        throw new Error("인증 토큰 발급 실패");
      }

      sessionStorage.setItem("reverifyToken", data.reverifyToken);
      sessionStorage.setItem("reverifyExpiresAt", String(data.expiresAt || ""));
      window.location.replace("/profile/edit");
    } catch (e2) {
      setErr(e2.message || String(e2));
    }
  };

  if (loading) {
    return (
      <main
        style={{
          maxWidth: 480,
          margin: "60px auto",
          padding: "24px 16px 40px",
          background: "#F9FAFB",
        }}
      >
        <div
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            background: "#FFFFFF",
            padding: 24,
            fontSize: 14,
            color: "#4B5563",
          }}
        >
          로딩 중…
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "60px auto",
        padding: "24px 16px 40px",
        background: "#F9FAFB",
      }}
    >
      {/* 카드 래퍼 */}
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          background: "#FFFFFF",
          padding: 24,
        }}
      >
        {/* 상단 타이틀 / 설명 */}
        <div
          style={{
            marginBottom: 12,
            fontSize: 20,
            fontWeight: 700,
            color: "#2563EB",
          }}
        >
          본인 확인
        </div>
        <p
          style={{
            color: "#4B5563",
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          프로필 변경을 위해{" "}
          <span style={{ color: "#2563EB", fontWeight: 600 }}>본인 인증</span>이 필요합니다.
        </p>

        {err && (
          <p
            style={{
              color: "#DC2626",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {err}
          </p>
        )}

        {/* LOCAL 로그인 사용자만 비밀번호 입력 폼 */}
        {provider === "LOCAL" ? (
          <form onSubmit={onSubmit}>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                color: "#4B5563",
              }}
            >
              현재 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                boxSizing: "border-box",
                borderRadius: 8,
                border: "1px solid #E8F0FE",
                marginBottom: 20,
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3B82F6";
                e.target.style.boxShadow = "0 0 0 1px #3B82F6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E8F0FE";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                background: "#3B82F6",
                color: "#FFFFFF",
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              확인
            </button>
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#6B7280",
              }}
            >
            </p>
          </form>
        ) : (
          // LOCAL이 아닌 경우: 소셜 계정 안내
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#4B5563",
            }}
          >
            소셜 계정으로 가입된 사용자입니다.{" "}
            <span style={{ color: "#2563EB", fontWeight: 600 }}>
              소셜 인증 화면
            </span>{" "}
            으로 이동 중입니다…
          </p>
        )}
      </div>
    </main>
  );
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
