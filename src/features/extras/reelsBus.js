// A tiny channel between the reels player (which knows what is on screen) and the assistant
// (which comments on it). They live in different features, so neither imports the other.
const EVENT = 'unya:reel';

// A reel started playing: { id, user, caption }
export function announceReel(reel) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { type: 'watching', reel } }));
}

// The reels player closed, switched to Subway, or hit an error.
export function announceReelsStopped() {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { type: 'stopped' } }));
}

// Returns an unsubscribe function. handler receives { type: 'watching' | 'stopped', reel? }.
export function onReelEvent(handler) {
  const listener = (event) => handler(event.detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
