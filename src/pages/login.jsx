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
      const bearer = await login({
        userId: form.userId.trim(),
        password: form.password,
      });

      const rawToken = bearer.startsWith("Bearer ") ? bearer.slice(7) : bearer;
      sessionStorage.setItem("jwt", rawToken);

      const meRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/me`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${rawToken}`,
          },
        }
      );

      let providerType = "LOCAL";
      let needsCategorySelection = false;

      if (meRes.ok) {
        const me = await meRes.json();
        sessionStorage.setItem("username", me.username || form.userId);
        providerType = me.provider || "LOCAL";
        sessionStorage.setItem("provider", providerType);
        needsCategorySelection = !!me.needsCategorySelection;
      } else {
        try {
          const t = await meRes.json();
          console.warn("me load failed:", t?.message || meRes.statusText);
        } catch {
          console.warn("me load failed");
        }
      }

      if (afterLogin) {
        await afterLogin();
      }

      if (needsCategorySelection) {
        // 네이버 제거
        const isSocial = providerType === "OAUTH_GOOGLE";

        const target = isSocial
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

  const circleBtn = {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "#fff",
  };

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "80px auto",
        padding: "50px 24px 15px 24px",
        textAlign: "center",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Nuzip</div>
      <p style={{ color: "#666", marginBottom: 32 }}>
        이메일과 비밀번호로 로그인하거나,<br />구글 계정으로 간편하게 시작하세요.
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          textAlign: "left",
          width: "100%",            
          boxSizing: "border-box",  
        }}
      >
        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          이메일(아이디)
        </label>
        <input
          name="userId"
          value={form.userId}
          onChange={onChange}
          placeholder="이메일"
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1px solid #ddd",
            borderRadius: 10,
            marginBottom: 14,
            background: "#fff",
            fontSize: 14,
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
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1px solid #ddd",
            borderRadius: 10,
            marginBottom: 18,
            background: "#fff",
            fontSize: 14,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px 16px",
            borderRadius: 12,
            background: loading ? "#ddd" : "#000000ff",
            color: "#ffffffff",
            border: "none",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 8,
          }}
        >
          {loading ? "로그인 중..." : "Nuzip 로그인"}
        </button>

        {err && (
          <p style={{ color: "#d00", marginTop: 12, fontSize: 13 }}>{err}</p>
        )}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "#666",
          }}
        >
          
          <span>
            회원가입{" "}<span
          onClick={() => nav("/register-choice")}
          style={{ color: "#2563eb", cursor: "pointer" }}
        >
          바로가기
        </span>
          </span>
        </div>
      </form>

      <div
        style={{
          marginTop: 36,
          display: "flex",
          alignItems: "center",
          gap: 16,
          color: "#bbb",
          fontSize: 13,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
        <span>다른 계정으로 로그인</span>
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 20 }}>
        <button type="button" onClick={() => goGoogleLogin()} style={circleBtn}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            style={{ width: 20, height: 20 }}
          />
        </button>
      </div>

      <p style={{ marginTop: 50, fontSize: 12, color: "#aaa" }}>
        문제 발생 시{" "}
        <Link to="/" style={{ color: "#2563eb" }}>
          메인
        </Link>{" "}
        으로 돌아가 다시 시도하세요.
      </p>
    </main>
  );
}

NuzipLogin.propTypes = {
  afterLogin: PropTypes.func,
};
