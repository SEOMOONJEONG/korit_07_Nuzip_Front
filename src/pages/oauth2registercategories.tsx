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
    <main
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "24px 16px 40px",
        background: "#F9FAFB",
      }}
    >
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          background: "#FFFFFF",
          padding: 24,
        }}
      >
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
            <span style={{ color: "#2563EB", fontWeight: 600 }}>{selected.length}</span> / 3
          </span>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={save}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: canSubmit ? "#3B82F6" : "#CBD5F5",
              color: "#FFFFFF",
              border: "none",
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {canSubmit ? "저장하고 시작하기" : "카테고리를 선택해 주세요"}
          </button>
        </div>

        {error && (
          <p
            style={{
              color: "#DC2626",
              marginTop: 12,
              fontSize: 13,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

NuzipRegister.propTypes = {
  onComplete: PropTypes.func,
};
