// 폼 회원가입 1단계
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  isValidEmail,
  sendEmailVerification,
  confirmEmailVerification,
} from "../api/nuzipclientapi";
import NuzipLogo from "./Nuzip_logo2.png"; // 🔹 로고 이미지 추가

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

  // signupDraft에 일부 값 저장하는 헬퍼
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
    sessionStorage.removeItem("signupDraft");
    sessionStorage.setItem("registerFlow", "step1");

    return () => {
      const status = sessionStorage.getItem("registerFlow");
      if (status === "step1") {
        sessionStorage.removeItem("signupDraft");
        sessionStorage.removeItem("registerFlow");
      }
    };
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

      persistDraft({
        userId: form.userId,
        emailVerified: true,
      });
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

    if (!form.userId || !form.password || !form.username) {
      setErr("이메일/비밀번호/이름은 필수입니다.");
      return;
    }

    if (!isValidEmail(form.userId)) {
      setErr("아이디는 이메일 형식이어야 합니다.");
      return;
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

    sessionStorage.setItem("signupDraft", JSON.stringify(draftPayload));
    sessionStorage.setItem("registerFlow", "step2");
    nav("/register/categories");
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
      {/* 🔹 상단 로고 + 회원가입 타이틀 */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img
          src={NuzipLogo}
          alt="Nuzip 로고"
          style={{
            width: 180,
            height: "auto",
          }}
        />
        <div
          style={{
            marginTop: 10,
            fontSize: 22,
            fontWeight: 700,
            color: "#2563EB", // 진한 남색/그레이톤
          }}
        >
          회원가입
        </div>
      </div>

      {/* 카드 형태 폼 래퍼 */}
      <div
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          background: "#FFFFFF",
          padding: 20,
        }}
      >
        <form onSubmit={goNext}>
          <Label>이메일 (아이디)</Label>
          <Input
            type="email"
            name="userId"
            value={form.userId}
            onChange={onChange}
            required
            disabled={emailVerified}
          />

          <div
            style={{
              display: "flex",
              gap: 8,
              boxSizing: "border-box",
              marginBottom: 12,
            }}
          >
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
                border: "1px solid #3B82F6",
                background: emailVerified ? "#3B82F6" : "#FFFFFF",
                color: emailVerified ? "#FFFFFF" : "#2563EB",
                cursor: emailVerified ? "default" : "pointer",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {emailVerified ? "인증 완료" : sendingEmail ? "발송 중..." : "인증 메일 보내기"}
            </button>
          </div>

          {!emailVerified && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="메일로 받은 6자리 코드"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid #E8F0FE",
                  borderRadius: 8,
                  boxSizing: "border-box",
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3B82F6";
                  e.target.style.boxShadow = "0 0 0 1px #3B82F6";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E8F0FE";
                  e.target.style.boxShadow = "none";
                }}
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
                  background: checkingCode ? "#CBD5F5" : "#3B82F6",
                  color: "#fff",
                  cursor: checkingCode ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  minWidth: 96,
                }}
              >
                {checkingCode ? "확인 중..." : "인증 확인"}
              </button>
            </div>
          )}

          {verificationNotice && (
            <p style={{ color: "#2563EB", fontSize: 12, marginBottom: 8 }}>
              {verificationNotice}
            </p>
          )}
          {verificationError && (
            <p style={{ color: "#DC2626", fontSize: 12, marginBottom: 8 }}>
              {verificationError}
            </p>
          )}
          {isGmail && (
            <p style={{ color: "#B45309", fontSize: 12, marginBottom: 8 }}>
              Gmail 계정은 하단의 구글 계정 빠른 가입을 이용해주세요.
            </p>
          )}

          <Label>비밀번호</Label>
          <Input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
          />

          <Label>이름</Label>
          <Input
            name="username"
            value={form.username}
            onChange={onChange}
            required
          />

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
          <Input
            type="date"
            name="birthDate"
            value={form.birthDate}
            onChange={onChange}
          />

          <button type="submit" style={btnPrimary}>
            다음 단계(카테고리 선택)
          </button>
        </form>

        {err && <p style={{ color: "#DC2626", marginTop: 12, fontSize: 13 }}>{err}</p>}
      </div>
    </main>
  );
}

const Label = (p) => (
  <label
    style={{
      display: "block",
      fontSize: 13,
      marginBottom: 6,
      color: "#4B5563",
    }}
    {...p}
  />
);

const Input = (p) => (
  <input
    {...p}
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "10px 12px",
      border: "1px solid #E8F0FE",
      borderRadius: 8,
      marginBottom: 12,
      fontSize: 14,
      outline: "none",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      ...(p.style || {}),
    }}
    onFocus={(e) => {
      p.onFocus && p.onFocus(e);
      e.target.style.borderColor = "#3B82F6";
      e.target.style.boxShadow = "0 0 0 1px #3B82F6";
    }}
    onBlur={(e) => {
      p.onBlur && p.onBlur(e);
      e.target.style.borderColor = "#E8F0FE";
      e.target.style.boxShadow = "none";
    }}
  />
);

const PhoneField = (p) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr auto 1fr",
      columnGap: 8,
      alignItems: "center",
      marginBottom: 12,
      width: "100%",
      boxSizing: "border-box",
    }}
    {...p}
  />
);

const PhoneInput = (p) => (
  <input
    {...p}
    inputMode="numeric"
    pattern="[0-9]*"
    style={{
      width: "100%",
      padding: "8px 10px",
      border: "1px solid #E8F0FE",
      borderRadius: 8,
      boxSizing: "border-box",
      fontSize: 14,
      outline: "none",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      ...(p.style || {}),
    }}
    onFocus={(e) => {
      p.onFocus && p.onFocus(e);
      e.target.style.borderColor = "#3B82F6";
      e.target.style.boxShadow = "0 0 0 1px #3B82F6";
    }}
    onBlur={(e) => {
      p.onBlur && p.onBlur(e);
      e.target.style.borderColor = "#E8F0FE";
      e.target.style.boxShadow = "none";
    }}
  />
);

const btnPrimary = {
  width: "100%",
  marginTop: 16,
  padding: "13px 16px",
  borderRadius: 8,
  background: "#3B82F6",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
};
