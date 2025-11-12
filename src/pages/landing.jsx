// 비로그인 메인화면
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const nav = useNavigate();

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "60px auto",
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>
        Nuzip — 뉴스를 한눈에, 빠르게
      </h1>
      <p style={{ color: "#666", fontSize: 16, marginBottom: 40 }}>
        로그인하거나 회원가입하고, 나만의 요약 뉴스 피드를 만나보세요.
      </p>

      {/* 버튼 섹션 */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <button
          onClick={() => nav("/login")}
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
            minWidth: 160,
          }}
        >
          로그인
        </button>

        <button
          onClick={() => nav("/register-choice")}
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
            minWidth: 160,
          }}
        >
          회원가입
        </button>
      </div>
    </main>
  );
}
