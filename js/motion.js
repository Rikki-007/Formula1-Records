// ============================================================
// Motion helpers — smooth entrance/transition animations.
// Implemented as plain CSS keyframe classes rather than an
// imperative animation library: guarantees content is never
// stuck invisible if a script is slow/blocked (progressive
// enhancement), and needs no third-party CDN dependency.
// ============================================================
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fade+slide the outgoing page out briefly before the router swaps content in.
// Non-blocking by design — the incoming page replaces the DOM immediately after,
// so this is a fire-and-forget cosmetic dip, never something navigation waits on.
export function pageOut(el) {
  if (!el || reduceMotion) return Promise.resolve();
  el.classList.remove("page-in");
  el.classList.add("page-out");
  return new Promise((resolve) => setTimeout(resolve, 120));
}

// Fade+slide the freshly-rendered page in.
export function pageIn(el) {
  if (!el) return;
  el.classList.remove("page-out");
  if (reduceMotion) return;
  el.classList.remove("page-in");
  void el.offsetWidth; // restart the animation
  el.classList.add("page-in");
}

// Stagger-reveal a list of cards as they enter.
export function revealCards(nodeList, { delay = 0.04 } = {}) {
  const items = Array.from(nodeList || []);
  if (!items.length || reduceMotion) return;
  items.forEach((n, i) => {
    n.style.animationDelay = `${(i * delay).toFixed(2)}s`;
    n.classList.add("card-reveal");
  });
}

// Crossfade an image in once it finishes loading (used for lazy driver photos).
export function fadeInImage(img) {
  if (!img || reduceMotion) return;
  img.classList.add("photo-in");
}

// One-shot scale/fade entrance, e.g. a profile hero photo.
export function popIn(el) {
  if (!el || reduceMotion) return;
  el.classList.add("pop-in");
}
