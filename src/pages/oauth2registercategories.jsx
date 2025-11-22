// OAuth2 회원가입후 카테고리 선택페이지
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { saveMyCategories } from "../api/nuzipclientapi";

// 서버 enum 키 + 한글 라벨 매핑
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

export default function NuzipRegister({ onComplete }) {
  const nav = useNavigate();
  const [selected, setSelected] = useState([]); // ✅ enum 키 배열로 관리
  const [error, setError] = useState(null);

  // 토큰 없으면 1단계로 돌려보내기 (OAuth2 성공 전에 접근 방지)
  useEffect(() => {
    const t = sessionStorage.getItem("jwt");
    if (!t) nav("/register", { replace: true });
  }, [nav]);

  const canSubmit = useMemo(() => selected.length === 3, [selected]); // ✅ 정확히 3개

  const toggle = (key) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((x) => x !== key);
      if (prev.length >= 3) {
        setError("카테고리는 최대 3개까지 선택 가능합니다.");
        setTimeout(() => setError(null), 1500);
        return prev;
      }
      return [...prev, key];
    });
  };

  const save = async () => {
    if (!canSubmit) return;
    try {
      // ✅ 백이 기대하는 바디: { categories: ["POLITICS","IT_SCIENCE","WORLD"] }
      await saveMyCategories(selected);
      if (onComplete) {
        await onComplete();
      }
      nav("/home", { replace: true });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "카테고리 저장 중 오류가 발생했습니다.";
      setError(msg);
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>회원가입 2단계</h1>
      <p style={{ marginBottom: 16 }}>관심 카테고리를 정확히 3개 선택하세요.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
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
        <span style={{ fontSize: 14, color: "#666" }}>선택: {selected.length} / 3</span>
        <button
          disabled={!canSubmit}
          onClick={save}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: canSubmit ? "#2563eb" : "#ccc",
            color: "#fff",
            border: "none",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          저장하고 시작하기
        </button>
      </div>

      {error && <p style={{ marginTop: 12, color: "#d00", fontSize: 14 }}>{error}</p>}
    </main>
  );
}

NuzipRegister.propTypes = {
  onComplete: PropTypes.func,
};
