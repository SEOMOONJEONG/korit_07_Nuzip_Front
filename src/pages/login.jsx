// 로그인화면
import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, Link } from "react-router-dom";
import { login, goGoogleLogin } from "../api/nuzipclientapi";

export default function NuzipLogin({ afterLogin }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ userId: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      // 1) 로그인 → Bearer ... 문자열 반환
      const bearer = await login({
        userId: form.userId.trim(),
        password: form.password,
      });

      // 2) 토큰만 저장 (네 인터셉터가 Bearer를 붙여줌)
      const rawToken = bearer.startsWith("Bearer ") ? bearer.slice(7) : bearer;
      sessionStorage.setItem("jwt", rawToken);

      // 3) 🔥 여기서 내 정보 조회해서 username 저장
      //    (백엔드: GET /api/users/me 가 { username, provider, ... } 반환한다고 가정)
      const meRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/me`,
        {
          headers: {
            "Content-Type": "application/json",
            // 이 fetch는 인터셉터가 없으니 Bearer 직접 붙여줌
            "Authorization": `Bearer ${rawToken}`,
          },
        }
      );

      let providerType = "LOCAL";
      let needsCategorySelection = false;

      if (meRes.ok) {
        const me = await meRes.json();
        // 필요 시 provider도 저장해서 프로필 화면에서 조건 렌더링에 활용
        sessionStorage.setItem("username", me.username || form.userId);
        providerType = me.provider || "LOCAL";
        sessionStorage.setItem("provider", providerType);
        needsCategorySelection = !!me.needsCategorySelection;
      } else {
        // 실패해도 로그인 자체는 진행되므로, 에러만 로깅하고 계속
        try {
          const t = await meRes.json();
          console.warn("me load failed:", t?.message || meRes.statusText);
        } catch {
          console.warn("me load failed");
        }
      }

      // 4) 후처리
      if (afterLogin) {
        await afterLogin();
      }

      if (needsCategorySelection) {
        const target =
          providerType === "OAUTH_GOOGLE"
            ? "/oauth2/register/categories"
            : "/register/categories";
        nav(target, { replace: true });
      } else {
        nav("/home", { replace: true });
      }
    } catch (e2) {
      const msg =
        e2?.response?.data?.message ||
        e2?.message ||
        "로그인에 실패했습니다.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };



  return (
    <main
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 12,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        로그인
      </h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>
        구글 계정 없이도 로그인할 수 있습니다.
      </p>

      <form onSubmit={onSubmit}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          이메일 아이디
        </label>
        <input
          name="userId"
          value={form.userId}
          onChange={onChange}
          placeholder="이메일형식"
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            marginBottom: 12,
          }}
        />

        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          비밀번호
        </label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="비밀번호"
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            marginBottom: 16,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            background: loading ? "#999" : "#111",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {err && (
        <p style={{ color: "#d00", marginTop: 12, fontSize: 14 }}>{err}</p>
      )}

      <div
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#888",
          fontSize: 12,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
        <span>또는</span>
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
      </div>

      <button
        onClick={() => goGoogleLogin()}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          background: "#4285F4",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          alt="Google"
          style={{
            width: 18,
            height: 18,
            verticalAlign: "middle",
            marginRight: 8,
            backgroundColor: "#fff",
            borderRadius: "50%",
            padding: 2,
          }}
        />
        구글 계정으로 로그인하기
      </button>

      <p style={{ marginTop: 14, fontSize: 13, color: "#666", textAlign: "center" }}>
        처음이라면 구글로 회원가입이 자동 진행됩니다.{" "}
        <Link to="/" style={{ color: "#2563eb" }}>
          메인으로
        </Link>
      </p>
    </main>
  );
}

NuzipLogin.propTypes = {
  afterLogin: PropTypes.func,
};
