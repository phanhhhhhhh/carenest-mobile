import { validatePhone, normalizePhone, validateEmail, validateLoginPassword } from './validators';

describe('validatePhone', () => {
  it('accepts a 9-digit number after stripping a leading 0', () => {
    expect(validatePhone('0768554948')).toBeUndefined();
    expect(validatePhone('768554948')).toBeUndefined();
  });

  it('accepts numbers with separators', () => {
    expect(validatePhone('076 855 4948')).toBeUndefined();
  });

  it('rejects an empty value', () => {
    expect(validatePhone('   ')).toBe('Vui lòng nhập số điện thoại');
  });

  it('rejects the wrong length', () => {
    expect(validatePhone('076855494')).toMatch(/không đúng định dạng/);
    expect(validatePhone('07685549488')).toMatch(/không đúng định dạng/);
  });

  it('rejects a leading digit that is not 3/5/7/8/9', () => {
    expect(validatePhone('0123456789')).toMatch(/không đúng định dạng/);
  });
});

describe('normalizePhone', () => {
  it('produces +84 E.164 form', () => {
    expect(normalizePhone('0768554948')).toBe('+84768554948');
    expect(normalizePhone('768554948')).toBe('+84768554948');
    expect(normalizePhone('076-855-4948')).toBe('+84768554948');
  });
});

describe('validateEmail', () => {
  it('accepts a normal address', () => {
    expect(validateEmail('ten@gmail.com')).toBeUndefined();
  });
  it('rejects blank and malformed addresses', () => {
    expect(validateEmail('')).toBe('Vui lòng nhập email');
    expect(validateEmail('ten@gmail')).toMatch(/không đúng định dạng/);
    expect(validateEmail('ten gmail.com')).toMatch(/không đúng định dạng/);
  });
});

describe('validateLoginPassword', () => {
  it('only checks presence and minimum length', () => {
    expect(validateLoginPassword('')).toBe('Vui lòng nhập mật khẩu');
    expect(validateLoginPassword('short')).toBe('Mật khẩu phải có ít nhất 8 ký tự');
    expect(validateLoginPassword('longenough')).toBeUndefined();
  });
});
