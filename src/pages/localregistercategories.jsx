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
      await api.post("/api/auth/register", draft);

      const bearer = await login({ userId: draft.userId, password: draft.password });
      const rawToken = bearer.startsWith("Bearer ") ? bearer.slice(7) : bearer;
      sessionStorage.setItem("jwt", rawToken);

      await api.post("/api/users/me/categories", { categories: selected });

      // ★ 정상 완료 시에만 플로우/임시 데이터 삭제
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
    <main style={{ maxWidth: 640, margin: "60px auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>이메일 회원가입 (2/2)</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>관심 카테고리를 정확히 3개 선택하세요.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {CATEGORY_OPTIONS.map(({ key, label }) => {
          const active = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 8,
                background: active ? "#111" : "#fff",
                color: active ? "#fff" : "#111",
                textAlign: "left",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#666" }}>선택: {selected.length} / 3</span>
        <button
          disabled={!canSubmit || loading}
          onClick={finish}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: canSubmit && !loading ? "#2563eb" : "#ccc",
            color: "#fff",
            border: "none",
            cursor: canSubmit && !loading ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "처리 중..." : "가입 완료"}
        </button>
      </div>

      {err && <p style={{ color: "#d00", marginTop: 12 }}>{err}</p>}
    </main>
  );
}

LocalRegisterCategories.propTypes = {
  onComplete: PropTypes.func,
};
