import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * 회원정보 수정 페이지
 * - LOCAL: 닉네임/카테고리/생년월일/핸드폰 + (조건)비밀번호 변경 가능
 * - OAUTH_GOOGLE: 비밀번호 섹션 숨김
 * - 비밀번호 변경은 현재 비번 확인 없이 new + confirm만 사용 (요구사항 반영)
 *
 * 주의:
 *  - Authorization: Bearer <jwt> 는 sessionStorage('jwt')에서 읽어 사용
 *  - 백엔드 엔드포인트 경로가 다르면 아래 fetch URL만 바꿔주세요
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

// 서버 enum 키 + 한글 라벨 매핑
const CATEGORY_OPTIONS = [
  { key: "POLITICS", label: "정치" },
  { key: "ECONOMY", label: "경제" },
  { key: "SOCIETY", label: "사회" },
  { key: "LIFE_CULTURE", label: "생활/문화" },
  { key: "IT_SCIENCE", label: "IT/과학" },
  { key: "WORLD", label: "세계" },
  { key: "ENTERTAINMENT", label: "엔터" },
  { key: "SPORTS", label: "스포츠" },
];

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]   = useState("");
  const [okMsg, setOkMsg]   = useState("");

  const [provider, setProvider]   = useState("LOCAL");
  const [username, setUsername]   = useState("");
  const [phoneParts, setPhoneParts] = useState({ first: "", second: "", third: "" });
  const [birthDate, setBirthDate] = useState("");
  const [categories, setCategories] = useState([]);

  const [newPassword, setNewPassword]               = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const rawToken = sessionStorage.getItem("jwt");
  const reverifyToken = sessionStorage.getItem("reverifyToken") || "";

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        // 1) 내 정보
        const meRes = await fetch(`${API_BASE}/api/users/me`, {
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${rawToken}` }
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

        // ✅ LOCAL은 reverifyToken 필수(없으면 인증 페이지로)
        if ((me.provider || "LOCAL") === "LOCAL" && !reverifyToken) {
          alert("본인 확인이 필요합니다.");
          window.location.replace("/profile/verify");
          return;
        }

        // 2) 카테고리
        const catRes = await fetch(`${API_BASE}/api/users/me/categories`, {
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${rawToken}` }
        });
        if (!catRes.ok) throw new Error("카테고리 조회 실패");
        const cats = await catRes.json();
        const parsedCategories = Array.isArray(cats)
          ? cats
          : Array.isArray(cats?.categories)
          ? cats.categories
          : [];
        setCategories(parsedCategories);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCategory = (c) => {
    setCategories(prev => {
      if (prev.includes(c)) return prev.filter(x => x !== c);
      if (prev.length >= 3) { alert("카테고리는 정확히 3개만 선택할 수 있습니다."); return prev; }
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

  const authHeaders = (withReverify=false) => {
    const h = { "Content-Type": "application/json", "Authorization": `Bearer ${rawToken}` };
    if (withReverify && provider === "LOCAL") {
      // ✅ LOCAL 저장 요청엔 임시 토큰을 함께 보냄 (백엔드에서 이 이름을 읽도록 구현)
      h["X-Reverify-Token"] = reverifyToken;
    }
    return h;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setOkMsg("");

    if (categories.length !== 3) {
      setError("카테고리는 정확히 3개를 선택해야 합니다.");
      return;
    }
    const wantsPwChange = provider === "LOCAL" && (newPassword || confirmNewPassword);
    if (wantsPwChange) {
      if (newPassword !== confirmNewPassword) { setError("새 비밀번호와 확인이 일치하지 않습니다."); return; }
    }
    const phoneDigits = `${phoneParts.first}${phoneParts.second}${phoneParts.third}`.replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length !== 11) { setError("핸드폰 번호는 정확히 11자리로 입력해주세요."); return; }

    const body = {
      username,
      phone: phoneDigits.length ? phoneDigits : null,
      birthDate: birthDate || null,
    };
    if (wantsPwChange) {
      body.newPassword = newPassword;
      body.confirmNewPassword = confirmNewPassword;
    }

    try {
      setSaving(true);

      // 1) 프로필/비번 저장 (LOCAL이면 X-Reverify-Token 포함)
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
      setNewPassword(""); setConfirmNewPassword("");

      // 토큰 1회용으로 설계했다면 여기서 제거(선택)
      // sessionStorage.removeItem("reverifyToken");
      // sessionStorage.removeItem("reverifyExpiresAt");
    } catch (e2) {
      setError(e2.message || String(e2));
    } finally {
      setSaving(false);
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

  if (loading) return <div style={{padding:16}}>로딩 중…</div>;

  return (
    <div style={{maxWidth:640, margin:"24px auto", padding:16, border:"1px solid #ddd", borderRadius:12}}>
      <h2 style={{marginTop:0}}>회원정보 수정</h2>

      {error && <div style={{marginBottom:12, padding:12, background:"#ffecec", border:"1px solid #ffb3b3", borderRadius:8}}>{error}</div>}
      {okMsg && <div style={{marginBottom:12, padding:12, background:"#e9ffe9", border:"1px solid #b3ffb3", borderRadius:8}}>{okMsg}</div>}

      <form onSubmit={onSubmit}>
        {/* 닉네임 */}
        <div style={{marginBottom:12}}>
          <label style={{display:"block", fontWeight:600, marginBottom:6}}>닉네임</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} required
            style={{width:"100%", padding:10, borderRadius:8, border:"1px solid #ccc"}} />
        </div>

        {/* 생년월일(선택) */}
        <div style={{marginBottom:12}}>
          <label style={{display:"block", fontWeight:600, marginBottom:6}}>생년월일 (선택)</label>
          <input type="date" value={birthDate || ""} onChange={e=>setBirthDate(e.target.value)}
            style={{width:"100%", padding:10, borderRadius:8, border:"1px solid #ccc"}} />
        </div>

        {/* 핸드폰(선택) */}
      <div style={{marginBottom:12}}>
        <label style={{display:"block", fontWeight:600, marginBottom:6}}>핸드폰 (선택)</label>
        <div style={{display:"flex", alignItems:"center", gap:4}}>
          
          <PhonePartInput value={phoneParts.first} onChange={(val) => handlePhoneChange("first", val)} maxLength={3} />
          
          <span>-</span>
          
          <PhonePartInput value={phoneParts.second} onChange={(val) => handlePhoneChange("second", val)} maxLength={4} />
          
          <span>-</span>
          
          <PhonePartInput value={phoneParts.third} onChange={(val) => handlePhoneChange("third", val)} maxLength={4} />
          
        </div>
      </div>

        {/* 카테고리(정확히 3개) */}
        <div style={{marginBottom:12}}>
          <label style={{display:"block", fontWeight:600, marginBottom:6}}>카테고리 (정확히 3개)</label>
          <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8}}>
            {CATEGORY_OPTIONS.map(({ key, label }) => {
              const selected = categories.includes(key);
              return (
                <button type="button" key={key} onClick={()=>toggleCategory(key)}
                  style={{padding:10, borderRadius:20, border:"1px solid #aaa", background:selected?"#e6f0ff":"#fff"}}>
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{marginTop:6, fontSize:12, color: categories.length===3 ? "#0a0" : "#a00"}}>
            현재 선택: {categories.length} / 3
          </div>
        </div>

        {/* 비밀번호 섹션: LOCAL만 */}
        {provider === "LOCAL" && (
          <fieldset style={{marginTop:18, padding:12, border:"1px dashed #bbb", borderRadius:8}}>
            <legend style={{padding:"0 8px"}}>비밀번호 변경 (선택)</legend>
            <div style={{marginBottom:8}}>
              <label style={{display:"block", fontWeight:600, marginBottom:6}}>새 비밀번호</label>
              <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                placeholder="새 비밀번호" style={{width:"100%", padding:10, borderRadius:8, border:"1px solid #ccc"}} />
            </div>
            <div>
              <label style={{display:"block", fontWeight:600, marginBottom:6}}>비밀번호 확인</label>
              <input type="password" value={confirmNewPassword} onChange={e=>setConfirmNewPassword(e.target.value)}
                placeholder="새 비밀번호 확인" style={{width:"100%", padding:10, borderRadius:8, border:"1px solid #ccc"}} />
            </div>
            <p style={{marginTop:8, fontSize:12, color:"#666"}}>
            </p>
          </fieldset>
        )}

        <div style={{marginTop:18, display:"flex", gap:8}}>
          <button type="submit" disabled={saving}
            style={{padding:"10px 16px", borderRadius:8, border:"1px solid #333", background:"#111", color:"#fff"}}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #b91c1c",
              background: deleting ? "#fecaca" : "#fee2e2",
              color: "#b91c1c",
            }}
          >
            {deleting ? "탈퇴 중..." : "회원 탈퇴"}
          </button>
        </div>
      </form>
    </div>
  );
}

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
    style={{ width: 70, padding:8, borderRadius:8, border:"1px solid #ccc" }}
  />
);

PhonePartInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number.isRequired,
  placeholder: PropTypes.string,
};

async function safeJson(res){ try { return await res.json(); } catch { return null; } }