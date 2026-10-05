// IntersectionObserver accepts px/% margins, but percentages use root width, not height.
const lookAheadVh = 150;

/** Extend lazy loading's look-ahead without replacing native src/srcset or picture selection. */
export function observeHomepageImages(document: Document, signal: AbortSignal) {
  const view = document.defaultView;
  if (!view || signal.aborted || typeof view.IntersectionObserver !== 'function') return;
  let observer: IntersectionObserver | undefined;
  let frame = 0;
  function connect() {
    frame = 0;
    if (signal.aborted) return;
    observer?.disconnect();
    const margin = (view!.innerHeight * lookAheadVh) / 100;
    const next = new view!.IntersectionObserver(
      (entries) => {
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
