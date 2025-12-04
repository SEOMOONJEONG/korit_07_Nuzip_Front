// 회원가입 선택 페이지(폼 / 구글)
import { useNavigate } from "react-router-dom";
import { goGoogleLogin } from "../api/nuzipclientapi";

export default function RegisterChoice() {
  const nav = useNavigate();

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "60px auto",
        padding: "24px 16px 40px",
        background: "#F9FAFB",
      }}
    >
      {/* 상단 타이틀 영역 */}
      <div
        style={{
          marginBottom: 16,
          fontSize: 20,
          fontWeight: 700,
          color: "#2563EB",
          textAlign: "left",
        }}
      >
        회원가입 방법 선택
      </div>

      {/* 카드 래퍼 */}
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          background: "#FFFFFF",
          padding: 20,
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#4B5563",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          Nuzip은 두 가지 방식으로 회원가입할 수 있습니다.
        </p>

        {/* 1️⃣ 자체 폼 회원가입 */}
        <button
          onClick={() => nav("/register")}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #3B82F6",
            background: "#FFFFFF",
            color: "#2563EB",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          이메일로 회원가입
        </button>

        {/* 2️⃣ 구글 연동 회원가입 */}
        <button
          onClick={() => goGoogleLogin()}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "none",
            background: "#3B82F6",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              backgroundColor: "#FFFFFF",
              borderRadius: "50%",
            }}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              style={{
                width: 16,
                height: 16,
              }}
            />
          </span>
          <span>구글 계정으로 가입하기</span>
        </button>

        <p
          style={{
            marginTop: 20,
            fontSize: 13,
            color: "#6B7280",
          }}
        >
          이미 계정이 있으신가요?{" "}
          <span
            onClick={() => nav("/login")}
            style={{ color: "#2563EB", cursor: "pointer", fontWeight: 500 }}
          >
            로그인하기
          </span>
        </p>
      </div>
    </main>
  );
}
