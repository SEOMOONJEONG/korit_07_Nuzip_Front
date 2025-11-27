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

  if (loading) return <div style={{padding:16}}>로딩 중…</div>;

  return (
    <main style={{maxWidth:420, margin:"60px auto", padding:24, border:"1px solid #eee", borderRadius:12}}>
      <h2 style={{marginTop:0}}>본인 확인</h2>
      <p style={{color:"#666"}}>비밀번호를 입력하여 본인 인증</p>
      {err && <p style={{color:"#c00"}}>{err}</p>}

      {/* ✅ provider 값을 조건 렌더링에 사용: LOCAL일 때만 폼 표시 */}
      {provider === "LOCAL" ? (
        <form onSubmit={onSubmit}>
          <label style={{display:"block", marginBottom:6}}>현재 비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            style={{width:"100%", padding:"10px 12px", boxSizing: "border-box", borderRadius:8, border:"1px solid #ccc", marginBottom:24}}
          />
          <button type="submit" style={{width:"100%", padding:"12px 16px", borderRadius:8, background:"#111", color:"#fff", border:"none"}}>
            확인
          </button>
        </form>
      ) : (
        // LOCAL이 아니면 useEffect에서 자동 이동 중
        <p style={{color:"#666"}}>소셜 계정은 비밀번호 확인 없이 수정 화면으로 이동합니다…</p>
      )}
    </main>
  );
}

async function safeJson(res){ try { return await res.json(); } catch { return null; } }
