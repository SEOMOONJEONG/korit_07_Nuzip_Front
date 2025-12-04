// 폼 회원가입 2단계
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { api, login } from "../api/nuzipclientapi";

const CATEGORY_OPTIONS = [
  { key: "POLITICS", label: "정치" },
  { key: "ECONOMY", label: "경제" },
  { key: "SOCIETY", label: "사회" },
  { key: "LIFE_CULTURE", label: "생활ㆍ문화" },
  { key: "IT_SCIENCE", label: "ITㆍ과학" },
  { key: "WORLD", label: "세계" },
  { key: "ENTERTAINMENT", label: "엔터" },
  { key: "SPORTS", label: "스포츠" },
];

export default function LocalRegisterCategories({ onComplete }) {
  const nav = useNavigate();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const draft = (() => {
    const raw = sessionStorage.getItem("signupDraft");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("저장된 회원가입 임시 데이터 파싱 실패:", e);
      return null;
    }
  })();

  // ★ 2단계 진입 자격 확인
  useEffect(() => {
    const status = sessionStorage.getItem("registerFlow");
    if (status !== "step2" || !draft || !draft.emailVerified) {
      sessionStorage.removeItem("signupDraft");
      sessionStorage.removeItem("registerFlow");
      nav("/register", { replace: true });
      return;
    }

    sessionStorage.setItem("registerFlow", "step2");
  }, [draft, nav]);

  const canSubmit = useMemo(() => selected.length === 3, [selected]);

  const toggle = (key) => {
    setSelected((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : prev.length < 3
        ? [...prev, key]
        : prev
    );
  };

  const finish = async () => {
    if (!draft || !canSubmit) return;
    if (!draft.emailVerified) {
      setErr("이메일 인증을 먼저 완료해 주세요.");
      return;
    }
    if ((draft.userId || "").toLowerCase().endsWith("@gmail.com")) {
      setErr("Gmail 계정은 구글 로그인을 이용해 주세요.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const payload = {
        userId: draft.userId,
        password: draft.password,
        username: draft.username,
        birthDate: draft.birthDate ?? null,
        phone: draft.phone ?? "",
      };
      await api.post("/api/auth/register", payload);

      const bearer = await login({
        userId: draft.userId,
        password: draft.password,
      });
      const rawToken = bearer.startsWith("Bearer ")
        ? bearer.slice(7)
        : bearer;
      sessionStorage.setItem("jwt", rawToken);

      await api.post("/api/users/me/categories", { categories: selected });

      sessionStorage.removeItem("signupDraft");
      sessionStorage.removeItem("registerFlow");

      if (onComplete) {
        await onComplete();
      }
      nav("/home", { replace: true });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "회원가입 또는 카테고리 저장 중 오류가 발생했습니다.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
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
      {/* 상단 타이틀 (1단계와 톤 맞춤) */}
      <div
        style={{
          marginBottom: 16,
          fontSize: 20,
          fontWeight: 700,
          color: "#2563EB",
        }}
      >
        관심 카테고리 선택
      </div>

      {/* 카드 래퍼 */}
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          background: "#FFFFFF",
          padding: 20,
        }}
      >
        <p
          style={{
            color: "#4B5563",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          뉴스 요약 피드를 위해 관심 있는 카테고리를{" "}
          <span style={{ color: "#2563EB", fontWeight: 600 }}>정확히 3개</span> 선택해 주세요.
        </p>

        {/* 카테고리 그리드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {CATEGORY_OPTIONS.map(({ key, label }) => {
            const active = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: active ? "1px solid #3B82F6" : "1px solid #E8F0FE",
                  background: active ? "#E8F0FE" : "#FFFFFF",
                  color: "#111827",
                  textAlign: "left",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                }}
              >
                <span>{label}</span>
                {active && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#2563EB",
                      fontWeight: 600,
                    }}
                  >
                    선택됨
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 하단 상태 + 버튼 */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            선택:{" "}
            <span style={{ color: "#2563EB", fontWeight: 600 }}>
              {selected.length}
            </span>{" "}
            / 3
          </span>

          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={finish}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background:
                canSubmit && !loading ? "#3B82F6" : "#CBD5F5",
              color: "#FFFFFF",
              border: "none",
              cursor:
                canSubmit && !loading ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {loading ? "처리 중..." : "가입 완료"}
          </button>
        </div>

        {err && (
          <p
            style={{
              color: "#DC2626",
              marginTop: 12,
              fontSize: 13,
            }}
          >
            {err}
          </p>
        )}
      </div>
    </main>
  );
}

LocalRegisterCategories.propTypes = {
  onComplete: PropTypes.func,
};
