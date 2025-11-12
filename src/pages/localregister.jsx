// 폼 회원가입 1단계
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { goGoogleLogin } from "../api/nuzipclientapi";

export default function LocalRegister() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    userId: "",
    password: "",
    username: "",
    birthDate: "",
  });
  const [phoneParts, setPhoneParts] = useState({
    first: "",
    second: "",
    third: "",
  });
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onPhoneChange = (part) => (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const limit = part === "first" ? 3 : 4;
    setPhoneParts((prev) => ({
      ...prev,
      [part]: digits.slice(0, limit),
    }));
  };

  useEffect(() => {
    const raw = sessionStorage.getItem("signupDraft");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      setForm({
        userId: draft.userId || "",
        password: draft.password || "",
        username: draft.username || "",
        birthDate: draft.birthDate || "",
      });
      if (draft.phone) {
        const digits = String(draft.phone).replace(/\D/g, "");
        setPhoneParts({
          first: digits.slice(0, 3),
          second: digits.slice(3, 7),
          third: digits.slice(7, 11),
        });
      }
    } catch (e) {
      console.warn("회원가입 임시 데이터 로드 실패:", e);
    }
  }, []);

  const goNext = (e) => {
    e.preventDefault();
    setErr("");
    // 필수값 체크(프론트)
    if (!form.userId || !form.password || !form.username) {
      setErr("아이디/비밀번호/이름은 필수입니다.");
      return;
    }

    const combinedPhone =
      phoneParts.first || phoneParts.second || phoneParts.third
        ? `${phoneParts.first}${phoneParts.second}${phoneParts.third}`
        : "";

    const draftPayload = {
      ...form,
      phone: combinedPhone,
    };
    // 1단계 임시 저장
    sessionStorage.setItem("signupDraft", JSON.stringify(draftPayload));
    // 2단계(카테고리)로 이동
    nav("/register/categories");
  };

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", padding: 24, border: "1px solid #eee", borderRadius: 12 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>이메일 회원가입 (1/2)</h1>
      <form onSubmit={goNext}>
        <Label>아이디 (이메일 형식 가능)</Label>
        <Input name="userId" value={form.userId} onChange={onChange} required />

        <Label>비밀번호</Label>
        <Input type="password" name="password" value={form.password} onChange={onChange} required />

        <Label>이름</Label>
        <Input name="username" value={form.username} onChange={onChange} required />

        <Label>전화번호 (선택)</Label>
        <PhoneField>
          
          <PhoneInput
            value={phoneParts.first}
            onChange={onPhoneChange("first")}
            maxLength={3}
          />
          
          <span>-</span>
          
          <PhoneInput
            value={phoneParts.second}
            onChange={onPhoneChange("second")}
            maxLength={4}
          />
          
          <span>-</span>
          
          <PhoneInput
            value={phoneParts.third}
            onChange={onPhoneChange("third")}
            maxLength={4}
          />
          
        </PhoneField>

        <Label>생년월일 (선택)</Label>
        <Input type="date" name="birthDate" value={form.birthDate} onChange={onChange} />

        <button type="submit" style={btnPrimary}>다음 단계(카테고리 선택)</button>
      </form>
      {err && <p style={{ color: "#d00", marginTop: 12 }}>{err}</p>}

      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#888",
          fontSize: 12,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
        <span>또는</span>
        <div style={{ flex: 1, height: 1, background: "#eee" }} />
      </div>

      <button
        onClick={() => goGoogleLogin()}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          background: "#4285F4",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        구글 계정으로 빠르게 가입하기
      </button>
    </main>
  );
}

const Label = (p) => <label style={{ display: "block", fontSize: 13, marginBottom: 6 }} {...p} />;
const Input = (p) => <input style={{ width: "100%", padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, marginBottom: 12 }} {...p} />;
const PhoneField = (p) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginBottom: 12,
    }}
    {...p}
  />
);
const PhoneInput = (p) => (
  <input
    inputMode="numeric"
    pattern="[0-9]*"
    style={{
      width: 64,
      padding: "8px 10px",
      border: "1px solid #ccc",
      borderRadius: 8,
    }}
    {...p}
  />
);
const btnPrimary = { width: "100%", marginTop: 12, padding: "12px 16px", borderRadius: 8, background: "#111", color: "#fff", border: "none", cursor: "pointer" };
