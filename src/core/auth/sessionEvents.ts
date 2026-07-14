/**
 * Session-expiry notification — port of Flutter's token_notifier.dart.
 *
 * The API client (client.ts) cannot import the auth store directly
 * (circular dependency: store → client → store), so it emits through
 * this tiny event registry instead. The auth store subscribes at module
 * load and resets its state, which makes AppNavigator switch back to
 * the Welcome screen.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to session-expired events. Returns an unsubscribe function. */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Call when the session expires (refresh-token failure, forced logout). */
export function emitSessionExpired(): void {
  for (const listener of listeners) listener();
}
