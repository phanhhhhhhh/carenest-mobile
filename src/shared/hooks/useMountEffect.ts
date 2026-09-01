import { useEffect, type EffectCallback } from 'react';

/**
 * Runs `effect` exactly once after the first render and runs its returned
 * cleanup on unmount — i.e. `useEffect(effect, [])`.
 *
 * Screens use this for their initial data fetch, where the effect body only
 * touches stable Zustand store actions (whose identity never changes) plus
 * one-shot locals like `new AbortController()`. Centralising the empty
 * dependency array here keeps the single `react-hooks/exhaustive-deps`
 * suppression in one reviewed place instead of copy-pasting it across screens.
 */
export function useMountEffect(effect: EffectCallback): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
