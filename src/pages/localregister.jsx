// 폼 회원가입 1단계
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
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
      // 이메일이 바뀌면 인증 상태 초기화
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

  // 🔹 1단계 진입 시: 항상 새 플로우 시작 (이메일 포함 모든 값 초기화)
  useEffect(() => {
    // 이전 가입 도중 남아있던 데이터 제거 → 새 1단계 시작
    sessionStorage.removeItem("signupDraft");
    sessionStorage.setItem("registerFlow", "step1");

    return () => {
      const status = sessionStorage.getItem("registerFlow");
      // 여전히 step1이면 → 2단계로 이동하지 않고 나간 것 → 플로우 초기화
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

      // 이메일 + 인증 완료 상태를 초안에 저장 (2단계에서 사용)
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

    // 필수값 체크
    if (!form.userId || !form.password || !form.username) {
      setErr("이메일/비밀번호/이름은 필수입니다.");
      return;
    }

    // 이메일 형식 체크
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

    // 중복 아이디(이메일) 체크
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

    // 1단계 전체 데이터 임시 저장 (2단계에서 사용)
    sessionStorage.setItem("signupDraft", JSON.stringify(draftPayload));

    // 이제 2단계로 이동한다는 표시
    sessionStorage.setItem("registerFlow", "step2");

    // 2단계(카테고리 선택) 페이지로 이동
    nav("/register/categories");
  };

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 24,
        border: "1px solid #eee",
        borderRadius: 12,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>회원가입</h1>
      <form onSubmit={goNext}>
        <Label>이메일 (아이디)</Label>
        <Input
          type="email"
          name="userId"
          value={form.userId}
          onChange={onChange}
          required
          disabled={emailVerified} // 인증 완료 시 수정 불가
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
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {/* 이 칸은 공통 Input 말고 개별 스타일 */}
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
                border: "1px solid #ccc",
                borderRadius: 8,
                boxSizing: "border-box",
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
          <p style={{ color: "#15803d", fontSize: 12, marginBottom: 8 }}>
            {verificationNotice}
          </p>
        )}
        {verificationError && (
          <p style={{ color: "#dc2626", fontSize: 12, marginBottom: 8 }}>
            {verificationError}
          </p>
        )}
        {isGmail && (
          <p style={{ color: "#b45309", fontSize: 12, marginBottom: 8 }}>
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
        {/* 필요 시 안내 문구 넣을 자리 */}
      </div>
    </main>
  );
}

const Label = (p) => (
  <label style={{ display: "block", fontSize: 13, marginBottom: 6 }} {...p} />
);

const Input = (p) => (
  <input
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "10px 12px",
      border: "1px solid #ccc",
      borderRadius: 8,
      marginBottom: 12,
    }}
    {...p}
  />
);

const PhoneField = (p) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr auto 1fr", // 인풋 3개 + '-' 2개
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
    inputMode="numeric"
    pattern="[0-9]*"
    style={{
      width: "100%",
      padding: "8px 10px",
      border: "1px solid #ccc",
      borderRadius: 8,
      boxSizing: "border-box",
    }}
    {...p}
  />
);

const btnPrimary = {
  width: "100%",
  marginTop: 12,
  padding: "12px 16px",
  borderRadius: 8,
  background: "#111",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};
