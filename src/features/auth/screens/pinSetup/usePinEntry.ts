import { useRef, useState } from 'react';
import { TextInput } from 'react-native';

/**
 * Owns the N PIN digit cells: per-box value, focus handoff and
 * backspace-to-previous. Calls `onComplete` with the joined PIN once the last
 * digit lands. `resetPin` clears the cells (no focus); `clearPin` also refocuses
 * the first box.
 */
export function usePinEntry(length: number, onComplete: (pin: string) => void) {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const resetPin = () => setPin(Array(length).fill(''));

  const clearPin = () => {
    resetPin();
    inputRefs.current[0]?.focus();
  };

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === length - 1) {
      const pinStr = [...newPin.slice(0, index), digit].join('');
      onComplete(pinStr);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  };

  return { pin, inputRefs, handleChange, handleKeyPress, clearPin, resetPin };
}
