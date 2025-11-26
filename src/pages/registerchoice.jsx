// 회원가입 선택 페이지(폼 / 구글)
import { useNavigate } from "react-router-dom";
import { goGoogleLogin } from "../api/nuzipclientapi";

export default function RegisterChoice() {
  const nav = useNavigate();

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 12,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        회원가입 방법 선택
      </h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 28 }}>
        Nuzip은 두 가지 방식으로 회원가입할 수 있습니다.
      </p>

      {/* 1️⃣ 자체 폼 회원가입 */}
      <button
        onClick={() => nav("/register")}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: "#fff",
          marginBottom: 16,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        회원가입
      </button>

      {/* 2️⃣ 구글 연동 회원가입 */}
      <button
        onClick={() => goGoogleLogin()}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          background: "#4285F4",
          color: "#fff",
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
          marginBottom: 12,
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
        구글 계정으로 가입하기
      </button>

      <p style={{ marginTop: 24, fontSize: 13, color: "#666" }}>
        이미 계정이 있으신가요?{" "}
        <span
          onClick={() => nav("/login")}
          style={{ color: "#2563eb", cursor: "pointer" }}
        >
          로그인하기
        </span>
      </p>
    </main>
  );
}
