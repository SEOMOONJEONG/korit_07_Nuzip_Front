export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

// 필수 조건: 8자 이상 + 영문 + 숫자 + 특수문자
export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'len', label: '8자 이상', test: (value) => value.length >= 8 },
  { id: 'letter', label: '영문 포함', test: (value) => /[A-Za-z]/.test(value) },
  { id: 'number', label: '숫자 포함', test: (value) => /\d/.test(value) },
  {
    id: 'symbol',
    label: '특수문자(!@#$% 등) 포함',
    test: (value) => /[!@#$%^&*()[\]{}_\-+=~`|\\:;"',.<>?/]/.test(value),
  },
];

export const getPasswordRuleStates = (value: string) =>
  PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(value),
  }));

export const isPasswordStrong = (value: string) => PASSWORD_RULES.every((rule) => rule.test(value));

export const validatePasswordStrength = (value?: string | null) => {
  if (!value) return '비밀번호를 입력해주세요.';
  const failedRule = PASSWORD_RULES.find((rule) => !rule.test(value));
  return failedRule ? `비밀번호 조건을 만족해주세요: ${failedRule.label}` : null;
};

