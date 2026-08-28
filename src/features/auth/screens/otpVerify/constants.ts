export const OTP_LENGTH = 6; // backend generates 6-digit codes
export const RESEND_SECONDS = 45;

export const Teal = '#12A79C';
export const SuccessGreen = '#22C55E';
export const SubtitleGray = '#8E8E8E';
export const BorderGray = '#C9CED4';
export const TextDark = '#37404A';
export const White = '#FFFFFF';

/** +84768554948 -> 0768554948 for display */
export function displayPhone(target: string): string {
  if (target.startsWith('+84')) return '0' + target.slice(3);
  return target;
}

export function formatCountdown(s: number): string {
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
