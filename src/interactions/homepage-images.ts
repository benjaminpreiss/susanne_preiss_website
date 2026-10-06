/**
 * Body-scoped image look-ahead for the homepage. This only promotes lazy images;
 * the browser still owns requests, responsive source selection and decoding.
 * Keep this separate from motion so image loading never depends on animation state.
 * @module
 */

// IntersectionObserver accepts px/% margins, but percentages use root width, not height.
const lookAheadVh = 150;

/**
 * Warm images shortly before they enter the viewport in either scroll direction.
 * Missing IntersectionObserver support falls back to the authored native loading policy.
 *
 * @param document Current homepage document; query only its currently mounted body.
 * @param signal Abort when that body is replaced to disconnect observers and resize work.
 */
export function observeHomepageImages(document: Document, signal: AbortSignal) {
  const view = document.defaultView;
  if (!view || signal.aborted || typeof view.IntersectionObserver !== 'function') return;
  let observer: IntersectionObserver | undefined;
  let frame = 0;
  /** Rebuild the pixel-based margin after rotation/resize; rootMargin cannot be edited in place. */
  function connect() {
    frame = 0;
    if (signal.aborted) return;
    observer?.disconnect();
    const margin = (view!.innerHeight * lookAheadVh) / 100;
    const next = new view!.IntersectionObserver(
      (entries) => {
        // A disconnected observer can still deliver a queued callback after a resize or swap.
        if (signal.aborted || observer !== next) return;
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof view!.HTMLImageElement)) continue;
          entry.target.loading = 'eager';
          next.unobserve(entry.target);
        }
      },
      { rootMargin: `${margin}px 0px` },
    );
    observer = next;
    for (const image of document.querySelectorAll<HTMLImageElement>(
      '.home-section .home-image img[loading="lazy"]',
    ))
      next.observe(image);
  }
  connect();
  view.addEventListener(
    'resize',
    () => {
      if (!frame) frame = view.requestAnimationFrame(connect);
    },
    { passive: true, signal },
  );
  signal.addEventListener(
    'abort',
    () => {
      observer?.disconnect();
      view.cancelAnimationFrame(frame);
    },
    { once: true },
  );
}
