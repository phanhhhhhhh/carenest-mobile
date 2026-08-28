import { useCallback, useRef, useState } from 'react';
import { Keyboard, TextInput } from 'react-native';
import { OTP_LENGTH } from './constants';

/**
 * Owns the 6 OTP digit cells: per-box value, focus handoff, paste handling and
 * backspace-to-previous. When the last digit lands it calls `onComplete` with the
 * joined code; if that resolves `false` (rejected) the cells are cleared and
 * refocused. `resetCode` does the same on demand (e.g. after "resend").
 */
export function useOtpInput(onComplete: (code: string) => Promise<boolean>) {
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const resetCode = useCallback(() => {
    setCode(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
  }, []);

  const submit = useCallback(
    async (full: string) => {
      Keyboard.dismiss();
      const ok = await onComplete(full);
      if (!ok) resetCode();
    },
    [onComplete, resetCode],
  );

  const handleChange = useCallback(
    (text: string, index: number) => {
      const sanitized = text.replace(/[^0-9]/g, '');

      if (sanitized.length > 1) {
        const digits = sanitized.slice(0, OTP_LENGTH).split('');
        const newCode = Array(OTP_LENGTH).fill('');
        digits.forEach((d, i) => {
          newCode[i] = d;
        });
        setCode(newCode);

        const nextEmpty = newCode.findIndex((d) => !d);
        if (nextEmpty !== -1) {
          inputs.current[nextEmpty]?.focus();
        } else {
          submit(newCode.join(''));
        }
        return;
      }

      const newCode = [...code];
      newCode[index] = sanitized.slice(0, 1);
      setCode(newCode);

      if (sanitized && index < OTP_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }

      if (index === OTP_LENGTH - 1 && sanitized) {
        submit(newCode.join(''));
      }
    },
    [code, submit],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key !== 'Backspace') return;
      if (code[index]) return;
      if (index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputs.current[index - 1]?.focus();
      }
    },
    [code],
  );

  return { code, inputs, handleChange, handleKeyPress, resetCode };
}
