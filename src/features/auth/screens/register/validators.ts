// Validators mirror the backend rules on RegisterRequest so the UI and API
// can never disagree.

export function validateName(v: string): string | undefined {
  if (!v.trim()) return 'Vui lòng nhập họ và tên';
  if (v.trim().length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
  return undefined;
}

/**
 * Phone is entered as local digits, displayed next to a fixed +84 prefix.
 * Accepts "0768554948" or "768554948" -> normalized to +84768554948.
 */
export function validatePhone(v: string): string | undefined {
  if (!v.trim()) return 'Vui lòng nhập số điện thoại';
  const digits = v.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length !== 9 || !/^[35789]/.test(digits)) {
    return 'Số điện thoại không đúng định dạng (VD: 0768554948)';
  }
  return undefined;
}

export function normalizePhone(v: string): string {
  return '+84' + v.replace(/\D/g, '').replace(/^0+/, '');
}

/** Mirrors backend's @Email + 255-char-max rule on RegisterRequest.email. */
export function validateEmail(v: string): string | undefined {
  if (!v.trim()) return 'Vui lòng nhập email';
  if (v.trim().length > 255) return 'Email quá dài';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
    return 'Email không đúng định dạng (VD: ten@gmail.com)';
  }
  return undefined;
}

// Password rules (mirror backend regex) - drives both the live checklist
// and validation.
export const PASSWORD_RULES = [
  { key: 'length', label: 'Ít nhất 8 ký tự', test: (v: string) => v.length >= 8 },
  { key: 'upper', label: 'Ít nhất 1 chữ hoa', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Ít nhất 1 chữ thường', test: (v: string) => /[a-z]/.test(v) },
  { key: 'digit', label: 'Ít nhất 1 chữ số', test: (v: string) => /\d/.test(v) },
  {
    key: 'special',
    label: 'Ít nhất 1 ký tự đặc biệt (VD: ! @ # ?)',
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

export function isPasswordValid(v: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(v));
}

export function validatePassword(v: string): string | undefined {
  if (!v) return 'Vui lòng nhập mật khẩu';
  if (!isPasswordValid(v)) {
    return 'Mật khẩu chưa đáp ứng đủ các điều kiện bên dưới';
  }
  return undefined;
}

export function validateConfirmPassword(pw: string, confirm: string): string | undefined {
  if (!confirm) return 'Vui lòng nhập lại mật khẩu';
  if (pw !== confirm) return 'Mật khẩu nhập lại không khớp';
  return undefined;
}
