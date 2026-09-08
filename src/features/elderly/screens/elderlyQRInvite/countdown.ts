import { useEffect, useState } from 'react';

export const QR_SIZE = 220;

export function secondsUntil(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function useCountdown(expiresAt: string | null): number {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(expiresAt));

  // Resync immediately when the target time changes (adjust-state-while-rendering)
  // so the display never lags a tick behind a freshly issued token.
  const [tracked, setTracked] = useState(expiresAt);
  if (tracked !== expiresAt) {
    setTracked(expiresAt);
    setSecondsLeft(secondsUntil(expiresAt));
  }

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setSecondsLeft(secondsUntil(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return secondsLeft;
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
