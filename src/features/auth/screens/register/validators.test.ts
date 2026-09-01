import {
  validateName,
  validateEmail,
  PASSWORD_RULES,
  isPasswordValid,
  validatePassword,
  validateConfirmPassword,
} from './validators';

describe('validateName', () => {
  it('requires at least 2 non-space characters', () => {
    expect(validateName('')).toBe('Vui lòng nhập họ và tên');
    expect(validateName(' a ')).toBe('Họ tên phải có ít nhất 2 ký tự');
    expect(validateName('An')).toBeUndefined();
  });
});

describe('validateEmail (register)', () => {
  it('rejects addresses longer than 255 chars', () => {
    const longLocal = 'a'.repeat(250);
    expect(validateEmail(`${longLocal}@x.com`)).toBe('Email quá dài');
  });
  it('accepts a valid address', () => {
    expect(validateEmail('user@example.com')).toBeUndefined();
  });
});

describe('password rules', () => {
  it('each rule flags its own missing class', () => {
    const byKey = Object.fromEntries(PASSWORD_RULES.map((r) => [r.key, r.test]));
    expect(byKey.length('abc')).toBe(false);
    expect(byKey.length('abcdefgh')).toBe(true);
    expect(byKey.upper('abcdefgh')).toBe(false);
    expect(byKey.upper('Abcdefgh')).toBe(true);
    expect(byKey.lower('ABCDEFGH')).toBe(false);
    expect(byKey.digit('Abcdefgh')).toBe(false);
    expect(byKey.digit('Abcdefg1')).toBe(true);
    expect(byKey.special('Abcdefg1')).toBe(false);
    expect(byKey.special('Abcdefg1!')).toBe(true);
  });

  it('isPasswordValid requires every rule', () => {
    expect(isPasswordValid('Abcdef1!')).toBe(true);
    expect(isPasswordValid('abcdef1!')).toBe(false);
  });

  it('validatePassword returns a message until all rules pass', () => {
    expect(validatePassword('')).toBe('Vui lòng nhập mật khẩu');
    expect(validatePassword('weak')).toBe('Mật khẩu chưa đáp ứng đủ các điều kiện bên dưới');
    expect(validatePassword('Abcdef1!')).toBeUndefined();
  });
});

describe('validateConfirmPassword', () => {
  it('requires a value and an exact match', () => {
    expect(validateConfirmPassword('Abcdef1!', '')).toBe('Vui lòng nhập lại mật khẩu');
    expect(validateConfirmPassword('Abcdef1!', 'Abcdef1?')).toBe('Mật khẩu nhập lại không khớp');
    expect(validateConfirmPassword('Abcdef1!', 'Abcdef1!')).toBeUndefined();
  });
});
