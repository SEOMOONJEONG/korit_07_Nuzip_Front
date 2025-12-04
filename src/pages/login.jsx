// 로그인화면
import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, Link } from "react-router-dom";
import { login, goGoogleLogin } from "../api/nuzipclientapi";
import NuzipLogo from "./Nuzip_logo2.png"; // 로고 이미지 추가

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

      const rawToken = bearer.startsWith("Bearer ")
        ? bearer.slice(7)
        : bearer;

      sessionStorage.setItem("jwt", rawToken);
      console.log('saved token', rawToken);
      
      const meRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/me`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${rawToken}`,
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
      }

      if (afterLogin) await afterLogin();

      if (needsCategorySelection) {
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
    border: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "#FFFFFF",
  };

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
          padding: "40px 24px 24px",
          textAlign: "center",
        }}
      >
        {/* 로고 */}
        <img
          src={NuzipLogo}
          alt="Nuzip Logo"
          style={{
            width: 180,
            height: "auto",
            marginBottom: 16,
          }}
        />

        <p style={{ color: "#4B5563", marginBottom: 28, fontSize: 14 }}>
          이메일과 비밀번호로 로그인하거나,<br />
          구글 계정으로 간편하게 시작하세요.
        </p>

        <form
          onSubmit={onSubmit}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            textAlign: "left",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 13,
              marginBottom: 6,
              color: "#4B5563",
            }}
          >
            이메일(아이디)
          </label>
          <input
            name="userId"
            value={form.userId}
            onChange={onChange}
            placeholder="이메일을 입력하세요"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: "1px solid #E8F0FE",
              borderRadius: 10,
              marginBottom: 14,
              background: "#FFFFFF",
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

          <label
            style={{
              display: "block",
              fontSize: 13,
              marginBottom: 6,
              color: "#4B5563",
            }}
          >
            비밀번호
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="비밀번호를 입력하세요"
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 14px",
              border: "1px solid #E8F0FE",
              borderRadius: 10,
              marginBottom: 18,
              background: "#FFFFFF",
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
            disabled={loading}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 16px",
              borderRadius: 12,
              background: loading ? "#CBD5F5" : "#3B82F6",
              color: "#FFFFFF",
              border: "none",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
              fontSize: 15,
            }}
          >
            {loading ? "로그인 중..." : "Nuzip 로그인"}
          </button>

          {err && (
            <p style={{ color: "#DC2626", marginTop: 12, fontSize: 13 }}>
              {err}
            </p>
          )}

          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            <span>
              아직 계정이 없으신가요?{" "}
              <span
                onClick={() => nav("/register-choice")}
                style={{ color: "#2563EB", cursor: "pointer", fontWeight: 500 }}
              >
                회원가입 바로가기
              </span>
            </span>
          </div>
        </form>

        {/* 구분선 */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#9CA3AF",
            fontSize: 13,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          <span>다른 계정으로 로그인</span>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        </div>

        {/* 구글 로그인 버튼 */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <button
            type="button"
            onClick={() => goGoogleLogin()}
            style={circleBtn}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              style={{ width: 20, height: 20 }}
            />
          </button>
        </div>

        <p style={{ marginTop: 40, fontSize: 12, color: "#9CA3AF" }}>
          문제 발생 시{" "}
          <Link to="/" style={{ color: "#2563EB" }}>
            메인
          </Link>{" "}
          으로 돌아가 다시 시도하세요.
        </p>
      </div>
    </main>
  );
}

NuzipLogin.propTypes = {
  afterLogin: PropTypes.func,
};
