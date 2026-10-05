import { gsap } from 'gsap';
import { pageInteractions } from './page';
import { observeHomepageImages } from './homepage-images';

/** Wheel/touch stay native. Keyboard section navigation, active controls and link scale are enhanced. */
export function mountHomepage(document: Document) {
  const view = document.defaultView;
  const sections = [...document.querySelectorAll<HTMLElement>('.home-section[data-home-section]')];
  const controls = document.querySelector<HTMLElement>('.section-controls');
  if (!view || !sections.length || !controls) return () => {};
  const controller = pageInteractions(document);
  const listeners = new AbortController();
  const signal = listeners.signal;
  observeHomepageImages(document, signal);
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = view.matchMedia('(max-aspect-ratio: 1/1)');
  let locked = false;
  let departing = false;
  let frame = 0;
  let current = '';
  let keyboardDestination: number | null = null;
  let keyboardInFlight: number | null = null;
  let keyboardTimer: number | undefined;
  function cancelKeyboard() {
    view!.clearTimeout(keyboardTimer);
    keyboardDestination = keyboardInFlight = null;
  }
  function finishKeyboard() {
    if (keyboardInFlight === null) return;
    view!.clearTimeout(keyboardTimer);
    const completed = keyboardInFlight;
    // Some browsers end an interrupted smooth scroll before its snap point.
    // Commit this requested boundary before starting another queued keyboard move.
    const section = sections[completed]!;
    if (Math.abs(section.getBoundingClientRect().top) > 1) {
      section.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    keyboardInFlight = null;
    if (keyboardDestination !== null && keyboardDestination !== completed)
      startKeyboard(keyboardDestination);
    else cancelKeyboard();
  }
  function keyboardSettling() {
    if (keyboardInFlight === null) return;
    view!.clearTimeout(keyboardTimer);
    // Scroll-idle fallback for browsers without scrollend and already-aligned targets.
    keyboardTimer = view!.setTimeout(finishKeyboard, 180);
  }
  function startKeyboard(index: number) {
    keyboardInFlight = index;
    sections[index]!.scrollIntoView({
      block: 'start',
      behavior: reduced.matches ? 'instant' : 'smooth',
    });
    if (reduced.matches) finishKeyboard();
    else keyboardSettling();
  }
  const links = sections.map((section) => {
    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.setAttribute(
      'aria-label',
      section.querySelector<HTMLElement>('h1, h2')?.innerText.replace(/\s+/g, ' ').trim() ??
        section.id,
    );
    link.title = link.getAttribute('aria-label')!;
    controls.append(link);
    return link;
  });
  function visibleSection() {
    const midpoint = view!.innerHeight / 2;
    return (
      sections.find((item) => {
        const rect = item.getBoundingClientRect();
        return rect.top <= midpoint && rect.bottom > midpoint;
      }) ?? sections[0]!
    );
  }
  function update() {
    frame = 0;
    if (locked || departing || (current && document.documentElement.dataset.routePhase)) return;
    const section = visibleSection();
    const key = section.dataset.homeSection!;
    const light = section.dataset.controlTone === 'light';
    // No numerical slide indices: identity and authored tone survive editorial reordering.
    document.documentElement.dataset.homeSection = key;
    document.documentElement.dataset.homeTone = light ? 'light' : 'dark';
    controls!.dataset.tone = light && !portrait.matches ? 'light' : 'dark';
    links.forEach((link, index) => {
      if (sections[index] === section) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const signature = `${key}:${portrait.matches}`;
    if (current !== signature) {
      current = signature;
      controller.setSection({ key, lightHeader: light, lightFooter: light && !portrait.matches });
    }
  }
  function schedule() {
    if (!frame) frame = view!.requestAnimationFrame(update);
  }
  const unsubscribe = controller.subscribe((state) => {
    locked = state.scrollLocked;
    if (locked) cancelKeyboard();
    else schedule();
  });
  view.addEventListener(
    'scroll',
    () => {
      schedule();
      keyboardSettling();
    },
    { passive: true, signal },
  );
  document.addEventListener('scrollend', finishKeyboard, { signal });
  // Native pointer input takes over immediately; never force a queued keyboard target afterwards.
  view.addEventListener('wheel', cancelKeyboard, { passive: true, signal });
  view.addEventListener('touchstart', cancelKeyboard, { passive: true, signal });
  document.addEventListener('pointerdown', cancelKeyboard, { passive: true, signal });
  view.addEventListener('resize', schedule, { passive: true, signal });
  view.addEventListener('pageshow', schedule, { signal });
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.defaultPrevented ||
        locked ||
        departing ||
        document.documentElement.dataset.routePhase ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      const direction =
        event.key === 'ArrowDown' || event.key === 'PageDown'
          ? 1
          : event.key === 'ArrowUp' || event.key === 'PageUp'
            ? -1
            : 0;
      if (!direction) {
        if (event.key === 'Home' || event.key === 'End') cancelKeyboard();
        return;
      }
      // Never consume editing, widget or dialog keyboard interactions.
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, button, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="listbox"], dialog',
        )
      )
        return;
      if (keyboardDestination !== null) {
        event.preventDefault();
        keyboardDestination = Math.max(
          0,
          Math.min(sections.length - 1, keyboardDestination + direction),
        );
        return;
      }
      const section = visibleSection();
      const rect = section.getBoundingClientRect();
      if (
        rect.height > view.innerHeight + 1 &&
        (direction > 0 ? rect.bottom > view.innerHeight + 1 : rect.top < -1)
      )
        return;
      const next = sections.indexOf(section) + direction;
      if (!sections[next]) return;
      event.preventDefault();
      keyboardDestination = next;
      startKeyboard(next);
    },
    { signal },
  );
  document.addEventListener(
    'site:page-departure',
    () => {
      departing = true;
      cancelKeyboard();
    },
    { signal },
  );
  document.addEventListener(
    'site:page-cancel',
    () => {
      departing = false;
      schedule();
    },
    { signal },
  );
  document.addEventListener(
    'site:page-transition',
    (event) => {
      if ((event as CustomEvent<{ stage: string }>).detail.stage === 'entry-end') schedule();
    },
    { signal },
  );
  const context = gsap.context(() => {});
  for (const link of document.querySelectorAll<HTMLElement>('.home-tile-link')) {
    const animate = () =>
      context.add(() => {
        gsap.to(link, {
          scale: !reduced.matches && link.matches(':hover, :focus-visible') ? 1.1 : 1,
          duration: reduced.matches ? 0 : 0.2,
          ease: 'power1.inOut',
          overwrite: true,
        });
      });
    for (const name of ['pointerenter', 'pointerleave', 'focus', 'blur'])
      link.addEventListener(name, animate, { signal });
    reduced.addEventListener('change', animate, { signal });
  }
  update();
  return () => {
    listeners.abort();
    cancelKeyboard();
    unsubscribe();
    view.cancelAnimationFrame(frame);
    context.revert();
    controls.replaceChildren();
    delete document.documentElement.dataset.homeSection;
    delete document.documentElement.dataset.homeTone;
    controller.setSection(null);
  };
}
