// 폼 회원가입 1단계
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  goGoogleLogin,
  isValidEmail,
  sendEmailVerification,
  confirmEmailVerification,
} from "../api/nuzipclientapi";

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
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationNotice, setVerificationNotice] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const persistDraft = (partial) => {
    const raw = sessionStorage.getItem("signupDraft");
    let base = {};
    if (raw) {
      try {
        base = JSON.parse(raw) || {};
      } catch (e) {
        console.warn("signupDraft 파싱 실패, 초기화합니다.", e);
      }
    }
    sessionStorage.setItem(
      "signupDraft",
      JSON.stringify({
        ...base,
        ...partial,
      })
    );
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "userId" ? value.trim().toLowerCase() : value;
    setForm((f) => ({ ...f, [name]: nextValue }));
    if (name === "userId") {
      setEmailVerified(false);
      setVerificationCode("");
      setVerificationNotice("");
      setVerificationError("");
    }
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
      setEmailVerified(Boolean(draft.emailVerified));
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

  const isGmail = (form.userId || "").toLowerCase().endsWith("@gmail.com");

  const sendVerification = async () => {
    setVerificationError("");
    setVerificationNotice("");
    if (!form.userId) {
      setVerificationError("이메일을 먼저 입력해주세요.");
      return;
    }
    if (!isValidEmail(form.userId)) {
      setVerificationError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    if (isGmail) {
      setVerificationError("Gmail 계정은 구글 로그인을 이용해주세요.");
      return;
    }
    try {
      setSendingEmail(true);
      await sendEmailVerification(form.userId);
      setVerificationNotice("인증 메일을 보냈습니다. 메일에서 6자리 코드를 확인하세요.");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "인증 메일 발송 중 오류가 발생했습니다.";
      setVerificationError(msg);
    } finally {
      setSendingEmail(false);
    }
  };

  const confirmVerification = async () => {
    setVerificationError("");
    setVerificationNotice("");
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError("6자리 인증 코드를 입력해주세요.");
      return;
    }
    try {
      setCheckingCode(true);
      await confirmEmailVerification({ email: form.userId, code: verificationCode });
      setEmailVerified(true);
      setVerificationNotice("이메일 인증이 완료되었습니다.");
      setErr("");
      persistDraft({ userId: form.userId, emailVerified: true });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "인증 코드 확인에 실패했습니다.";
      setVerificationError(msg);
    } finally {
      setCheckingCode(false);
    }
  };

  const goNext = async (e) => {
    e.preventDefault();
    setErr("");
    // 필수값 체크(프론트)
    if (!form.userId || !form.password || !form.username) {
      setErr("이메일/비밀번호/이름은 필수입니다.");
      return;
    }
    
    // 이메일 형식 체크
    if (!isValidEmail(form.userId)) {
      setErr("아이디는 이메일 형식이어야 합니다.");
      return; // ❗ 형식 틀리면 여기서 끝 → 다음 단계 이동 X
    }

    if (isGmail) {
      setErr("Gmail 계정은 구글 로그인을 이용해 주세요.");
      return;
    }

    if (!emailVerified) {
      setErr("이메일 인증을 완료해 주세요.");
      return;
    }

    try {
      // 중복 아이디(이메일) 체크
      await api.get("/api/auth/register/check", {
        params: { userId: form.userId },
      });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "이미 존재하는 아이디(이메일) 입니다.";
      setErr(msg);
      return;
    }

    const combinedPhone =
      phoneParts.first || phoneParts.second || phoneParts.third
        ? `${phoneParts.first}${phoneParts.second}${phoneParts.third}`
        : "";

    const draftPayload = {
      ...form,
      phone: combinedPhone,
      emailVerified: true,
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
        <Label>이메일 (아이디)</Label>
        <Input 
        type="email" 
        name="userId" 
        value={form.userId} 
        onChange={onChange} 
        required />
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            onClick={sendVerification}
            disabled={
              sendingEmail ||
              emailVerified ||
              !form.userId ||
              !isValidEmail(form.userId) ||
              isGmail
            }
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: emailVerified ? "#16a34a" : "#f4f4f5",
              color: emailVerified ? "#fff" : "#111",
              cursor: emailVerified ? "default" : "pointer",
            }}
          >
            {emailVerified ? "인증 완료" : sendingEmail ? "발송 중..." : "인증 메일 보내기"}
          </button>
        </div>
        {!emailVerified && (
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="메일로 받은 6자리 코드"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <button
              type="button"
              onClick={confirmVerification}
              disabled={
                checkingCode || verificationCode.length !== 6 || !form.userId || isGmail 
              }
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: checkingCode ? "#ccc" : "#111",
                color: "#fff",
                cursor: checkingCode ? "not-allowed" : "pointer",
              }}
            >
              {checkingCode ? "확인 중..." : "인증 확인"}
            </button>
          </div>
        )}
        {verificationNotice && (
          <p style={{ color: "#15803d", fontSize: 12, marginBottom: 8 }}>{verificationNotice}</p>
        )}
        {verificationError && (
          <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 8 }}>{verificationError}</p>
        )}
        {isGmail && (
          <p style={{ color: "#b45309", fontSize: 12, marginBottom: 8 }}>
            Gmail 계정은 하단의 구글 계정 빠른 가입을 이용해주세요.
          </p>
        )}

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
