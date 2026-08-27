export interface FieldErrors {
  phone?: string;
  email?: string;
  password?: string;
}

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

export function validateEmail(v: string): string | undefined {
  if (!v.trim()) return 'Vui lòng nhập email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
    return 'Email không đúng định dạng (VD: ten@gmail.com)';
  }
  return undefined;
}

/** Login only checks presence + length; full complexity rules live on Register. */
export function validateLoginPassword(v: string): string | undefined {
  if (!v) return 'Vui lòng nhập mật khẩu';
  if (v.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
  return undefined;
}
