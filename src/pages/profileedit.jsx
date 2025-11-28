import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [provider, setProvider] = useState("LOCAL");
  const [username, setUsername] = useState("");
  const [phoneParts, setPhoneParts] = useState({ first: "", second: "", third: "" });
  const [birthDate, setBirthDate] = useState("");
  const [categories, setCategories] = useState([]);

  // 🔹 비밀번호 모달 상태
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState("");

  const rawToken = sessionStorage.getItem("jwt");
  const reverifyToken = sessionStorage.getItem("reverifyToken") || "";

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        // 1) 내 정보
        const meRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${rawToken}`,
          },
        });
        if (!meRes.ok) throw new Error("내 정보 조회 실패");
        const me = await meRes.json();

        setProvider(me.provider || "LOCAL");
        setUsername(me.username || "");
        const digits = (me.phone || "").replace(/\D/g, "");
        setPhoneParts({
          first: digits.slice(0, 3),
          second: digits.slice(3, 7),
          third: digits.slice(7, 11),
        });
        setBirthDate(me.birthDate || "");

        // LOCAL 은 재인증 토큰 필수
        if ((me.provider || "LOCAL") === "LOCAL" && !reverifyToken) {
          alert("본인 확인이 필요합니다.");
          window.location.replace("/profile/verify");
          return;
        }

        // 2) 카테고리
        const catRes = await fetch(`${API_BASE}/api/users/me/categories`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${rawToken}`,
          },
        });
        if (!catRes.ok) throw new Error("카테고리 조회 실패");
        const cats = await catRes.json();
        const parsed = Array.isArray(cats)
          ? cats
          : Array.isArray(cats?.categories)
          ? cats.categories
          : [];
        setCategories(parsed);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeaders = (withReverify = false) => {
    const h = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${rawToken}`,
    };
    if (withReverify && provider === "LOCAL") {
      h["X-Reverify-Token"] = reverifyToken;
    }
    return h;
  };

  const toggleCategory = (c) => {
    setCategories((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= 3) {
        alert("카테고리는 정확히 3개만 선택할 수 있습니다.");
        return prev;
      }
      return [...prev, c];
    });
  };

  const handlePhoneChange = (part, value) => {
    const limit = part === "first" ? 3 : 4;
    const digits = value.replace(/\D/g, "");
    setPhoneParts((prev) => ({
      ...prev,
      [part]: digits.slice(0, limit),
    }));
  };

  // 🔹 프로필/카테고리 저장
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (categories.length !== 3) {
      setError("카테고리는 정확히 3개를 선택해야 합니다.");
      return;
    }

    const phoneDigits = `${phoneParts.first}${phoneParts.second}${phoneParts.third}`.replace(
      /\D/g,
      ""
    );
    if (phoneDigits && phoneDigits.length !== 11) {
      setError("핸드폰 번호는 정확히 11자리로 입력해주세요.");
      return;
    }

    const body = {
      username,
      phone: phoneDigits.length ? phoneDigits : null,
      birthDate: birthDate || null,
    };

    try {
      setSaving(true);

      // 1) 프로필 저장
      const upRes = await fetch(`${API_BASE}/api/users/me`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify(body),
      });
      if (!upRes.ok) {
        const t = await safeJson(upRes);
        throw new Error(t?.message || "회원정보 수정 실패");
      }

      // 2) 카테고리 저장
      const catRes = await fetch(`${API_BASE}/api/users/me/categories`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ categories }),
      });
      if (!catRes.ok) {
        const t = await safeJson(catRes);
        throw new Error(t?.message || "카테고리 저장 실패");
      }

      setOkMsg("수정이 완료되었습니다.");
    } catch (e2) {
      setError(e2.message || String(e2));
    } finally {
      setSaving(false);
    }
  };

  // 🔹 비밀번호 변경 모달 제출
  const submitPasswordChange = async () => {
    setPwError("");
    setPwOk("");

    if (!newPassword || !confirmNewPassword) {
      setPwError("새 비밀번호와 확인을 모두 입력해주세요.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError("새 비밀번호와 확인이 일치하지 않습니다.");
      return;
    }

    try {
      setPwSaving(true);

      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: "PATCH",
        headers: authHeaders(true),   // ✅ 프로필 저장과 완전히 동일한 헤더 사용
        body: JSON.stringify({
          newPassword,
          confirmNewPassword,
        }),
      });

      if (!res.ok) {
        const t = await safeJson(res);
        throw new Error(t?.message || "비밀번호 변경에 실패했습니다.");
      }

      setPwOk("비밀번호가 변경되었습니다.");
      setNewPassword("");
      setConfirmNewPassword("");

      setTimeout(() => {
        setPwModalOpen(false);
        setPwOk("");
      }, 800);
    } catch (e2) {
      setPwError(e2.message || String(e2));
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말로 회원 탈퇴를 진행할까요? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    setError("");
    setOkMsg("");
    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: "DELETE",
        headers: authHeaders(true),
      });
      if (!res.ok) {
        const t = await safeJson(res);
        throw new Error(t?.message || "회원 탈퇴에 실패했습니다.");
      }

      sessionStorage.removeItem("jwt");
      sessionStorage.removeItem("reverifyToken");
      sessionStorage.removeItem("reverifyExpiresAt");
      alert("회원 탈퇴가 완료되었습니다.");
      navigate("/landing", { replace: true });
      window.location.reload();
    } catch (e2) {
      setError(e2.message || String(e2));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>로딩 중…</div>;

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 12,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>회원정보 수정</h1>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: "#ffecec",
            border: "1px solid #ffb3b3",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      {okMsg && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: "#e9ffe9",
            border: "1px solid #b3ffb3",
            fontSize: 13,
          }}
        >
          {okMsg}
        </div>
      )}

      <form onSubmit={onSubmit}>
        {/* 닉네임 */}
        <FormField label="닉네임">
          <TextInput value={username} onChange={(e) => setUsername(e.target.value)} required />
        </FormField>

        {/* 생년월일 */}
        <FormField label="생년월일 (선택)">
          <TextInput
            type="date"
            value={birthDate || ""}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </FormField>

        {/* 핸드폰 */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            핸드폰 (선택)
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr auto 1fr", // 인풋 3개 + '-' 2개
              columnGap: 8,
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <PhonePartInput
              value={phoneParts.first}
              onChange={(val) => handlePhoneChange("first", val)}
              maxLength={3}
            />
            <span>-</span>
            <PhonePartInput
              value={phoneParts.second}
              onChange={(val) => handlePhoneChange("second", val)}
              maxLength={4}
            />
            <span>-</span>
            <PhonePartInput
              value={phoneParts.third}
              onChange={(val) => handlePhoneChange("third", val)}
              maxLength={4}
            />
          </div>
        </div>

        {/* 카테고리 */}
        <FormField label="관심 카테고리 (정확히 3개)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CATEGORY_OPTIONS.map(({ key, label }) => {
              const active = categories.includes(key);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleCategory(key)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: active ? "#111" : "#fff",
                    color: active ? "#fff" : "#111",
                    textAlign: "left",
                    fontSize: 14,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: categories.length === 3 ? "#16a34a" : "#dc2626",
            }}
          >
            선택: {categories.length} / 3
          </div>
        </FormField>

        {/* 비밀번호 수정 행 (LOCAL만) */}
        {provider === "LOCAL" && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14, color: "#111" }}>비밀번호</span>
            <button
              type="button"
              onClick={() => {
                setPwModalOpen(true);
                setPwError("");
                setPwOk("");
                setNewPassword("");
                setConfirmNewPassword("");
              }}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #111",
                background: "#111",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              수정
            </button>
          </div>
        )}

        {/* 저장 버튼 */}
        <button type="submit" disabled={saving} style={btnPrimary}>
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </form>

      {/* 회원 탈퇴 링크 스타일 */}
      <div
        onClick={deleting ? undefined : handleDeleteAccount}
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          cursor: deleting ? "not-allowed" : "pointer",
          opacity: deleting ? 0.5 : 1,
          fontSize: 13,
          color: "#666",
          gap: 4,
        }}
      >
        <span>회원탈퇴</span>
        <span style={{ fontSize: 16 }}>›</span>
      </div>

      {/* 비밀번호 변경 모달 */}
      {pwModalOpen && provider === "LOCAL" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: 360,
              maxWidth: "90%",
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>비밀번호 변경</h2>

            {pwError && (
              <div
                style={{
                  marginBottom: 10,
                  padding: 8,
                  borderRadius: 8,
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  fontSize: 12,
                  color: "#b91c1c",
                }}
              >
                {pwError}
              </div>
            )}
            {pwOk && (
              <div
                style={{
                  marginBottom: 10,
                  padding: 8,
                  borderRadius: 8,
                  background: "#dcfce7",
                  border: "1px solid #bbf7d0",
                  fontSize: 12,
                  color: "#166534",
                }}
              >
                {pwOk}
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                새 비밀번호
              </label>
              <TextInput
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                비밀번호 확인
              </label>
              <TextInput
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="새 비밀번호 확인"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  if (pwSaving) return;
                  setPwModalOpen(false);
                  setPwError("");
                  setPwOk("");
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "#f5f5f5",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitPasswordChange}
                disabled={pwSaving}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#111",
                  color: "#fff",
                  fontSize: 13,
                  cursor: pwSaving ? "not-allowed" : "pointer",
                }}
              >
                {pwSaving ? "변경 중..." : "변경"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== 공통 컴포넌트들 ===== */

const FormField = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const TextInput = (props) => (
  <input
    {...props}
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "10px 12px",
      border: "1px solid #ccc",
      borderRadius: 8,
      fontSize: 14,
      ...(props.style || {}),
    }}
  />
);

TextInput.propTypes = {
  style: PropTypes.object,
};

const PhonePartInput = ({ value, onChange, maxLength, placeholder }) => (
  <input
    value={value}
    onChange={(e) => {
      const digits = e.target.value.replace(/\D/g, "");
      onChange(digits.slice(0, maxLength));
    }}
    inputMode="numeric"
    pattern="[0-9]*"
    maxLength={maxLength}
    placeholder={placeholder}
    style={{
      width: "100%", 
      padding: 8,
      borderRadius: 8,
      border: "1px solid #ccc",
      boxSizing: "border-box",
    }}
  />
);


PhonePartInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number.isRequired,
  placeholder: PropTypes.string,
};

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

const btnPrimary = {
  width: "100%",
  marginTop: 20,
  padding: "12px 16px",
  borderRadius: 8,
  background: "#111",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
};
