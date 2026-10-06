import { gsap } from 'gsap';

/**
 * Shared GSAP choreography for menus and page navigation.
 * Callers own dialogs, routing, focus and scroll locks; this file owns visual timing.
 * CSS keeps simple hover effects and viewport-relative layout offsets.
 * @module
 */

/**
 * Give one timeline a lifetime: completion waits, reversible playback and cleanup.
 * Reversing or pausing does not discard its current pose. Destroying it restores
 * original styles and releases any caller still waiting on an interrupted sequence.
 */
function managedTimeline(document: Document, build: (timeline: gsap.core.Timeline) => void) {
  const reduced = document.defaultView!.matchMedia('(prefers-reduced-motion: reduce)');
  const waiters = new Set<() => void>();
  const complete = () => {
    for (const resolve of waiters) resolve();
    waiters.clear();
  };
  let timeline!: gsap.core.Timeline;
  let disposed = false;
  let opening = true;
  const context = gsap.context(() => {
    timeline = gsap.timeline({ paused: true, onComplete: complete, onReverseComplete: complete });
    build(timeline);
  });
  const finish = () => {
    timeline.progress(opening ? 1 : 0).pause();
    complete(); // Empty timelines and already-settled endpoints need no animation callback.
  };
  const preferenceChanged = () => {
    if (reduced.matches) finish();
  };
  reduced.addEventListener('change', preferenceChanged);
  const move = (forward: boolean) => {
    if (disposed) return Promise.resolve();
    opening = forward;
    const finished = new Promise<void>((resolve) => waiters.add(resolve));
    if (reduced.matches || timeline.duration() === 0 || timeline.progress() === (forward ? 1 : 0))
      finish();
    else if (forward) timeline.play();
    else timeline.reverse();
    return finished;
  };
  return {
    open: () => move(true),
    close: () => move(false),
    pause: () => {
      if (!disposed) timeline.pause();
    },
    resume: () => {
      if (disposed) return;
      if (reduced.matches) finish();
      else timeline.resume();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      reduced.removeEventListener('change', preferenceChanged);
      context.revert();
      complete();
    },
  };
}

/** Ignore absent controls (utility pages, hidden layouts) instead of creating empty tweens. */
function tween(
  timeline: gsap.core.Timeline,
  root: ParentNode | undefined,
  selector: string,
  properties: gsap.TweenVars,
  entering = false,
  at = 0,
) {
  const targets = root?.querySelectorAll<HTMLElement>(selector);
  if (!targets?.length) return;
  timeline[entering ? 'from' : 'to'](targets, { ease: 'power1.inOut', ...properties }, at);
}

/** Desktop images and text leave toward their own side; entry uses the same poses in reverse. */
function splitDesktop(timeline: gsap.core.Timeline, document: Document, entering = false) {
  for (const [side, xPercent] of [
    ['left', -100],
    ['right', 100],
  ] as const) {
    tween(
      timeline,
      document,
      `.home-image.home-${side}`,
      { xPercent, opacity: 0, duration: 0.5 },
      entering,
    );
    tween(timeline, document, `.home-copy.home-${side}`, { xPercent, duration: 0.7 }, entering);
  }
}

/** Shared portrait split for menu and route stages; neighboring slides never move. */
function splitPortrait(
  timeline: gsap.core.Timeline,
  document: Document,
  sectionKey: string | undefined,
  entering = false,
) {
  const section = [...document.querySelectorAll<HTMLElement>('.home-section')].find(
    (node) => node.dataset.homeSection === sectionKey,
  );
  // CSS viewport-unit offsets stay independent of image growth and text translation.
  tween(
    timeline,
    section,
    '.home-image',
    {
      '--panel-motion-y': '-100vh',
      opacity: 0,
      duration: 0.7,
    },
    entering,
  );
  tween(
    timeline,
    section,
    '.home-copy',
    {
      '--panel-motion-y': '100vh',
      opacity: 0,
      duration: 0.7,
    },
    entering,
  );
}

/**
 * Build a reversible menu sequence: content/controls leave, then menu links appear.
 * Closing reverses that same sequence, including an opening interrupted halfway.
 * Capture the active portrait slide once so neighboring images never enter the screen.
 *
 * @returns open/close completion promises plus pause/resume for a pending route departure.
 * Call destroy after closing, before body replacement, or when the owner unmounts.
 */
export function createMenuMotion(
  document: Document,
  dialog: HTMLDialogElement,
  options: { sectionKey?: string; lightHeader: boolean },
) {
  const home = document.documentElement.dataset.pageKind === 'home';
  const portrait = document.defaultView!.matchMedia('(max-aspect-ratio: 1/1)').matches;
  return managedTimeline(document, (timeline) => {
    // Stage 1: move the underlying page and controls out together.
    if (home && portrait) splitPortrait(timeline, document, options.sectionKey);
    else if (home) splitDesktop(timeline, document);
    else tween(timeline, document, 'main.content', { xPercent: -100, opacity: 0, duration: 0.25 });

    if (home) {
      // Likewise, preserve the controls' independent CSS translate used for centering.
      tween(timeline, document, '.section-controls', {
        '--controls-motion-x': '300%',
        color: '#333',
        duration: 0.5,
      });
      const close = dialog.querySelector('.dismiss-menu');
      if (close)
        timeline.fromTo(
          close,
          { color: options.lightHeader ? '#efeae3' : '#2b2c36' },
          { color: '#2b2c36', duration: 0.4 },
          0,
        );
    }
    tween(timeline, document, '.site-footer', {
      yPercent: 300,
      ...(home ? { color: '#000' } : {}),
      duration: 0.5,
    });
    tween(timeline, document, '.header-background', { xPercent: -100, duration: 0.25 });
    tween(timeline, document, '.site-header .home', { xPercent: -300, duration: 0.25 });

    // The dialog owns the visible toggle while open; morph its bars from hamburger to X.
    tween(
      timeline,
      dialog,
      '.dismiss-menu span:nth-child(1)',
      { rotation: 0, top: 0, duration: 0.4 },
      true,
    );
    tween(timeline, dialog, '.dismiss-menu span:nth-child(2)', { opacity: 1, duration: 0.2 }, true);
    tween(
      timeline,
      dialog,
      '.dismiss-menu span:nth-child(3)',
      { rotation: 0, top: '90%', duration: 0.4 },
      true,
    );

    // Stage 2: reveal links only after the longest outgoing movement has finished.
    tween(
      timeline,
      dialog,
      '.main-navigation',
      { opacity: 0, duration: 0.5 },
      true,
      home ? 0.7 : 0.5,
    );
  });
}

/**
 * Build one route stage. Entry poses are installed immediately, before the new body paints.
 * run() completes when Astro may swap the old body or finish the new body's entrance.
 * destroy() restores original styles, also settling an interrupted wait.
 */
export function createPageMotion(
  document: Document,
  options: { entering: boolean; menuOpen?: boolean; returning?: boolean },
) {
  const entering = options.entering;
  const home = document.documentElement.dataset.pageKind === 'home';
  const utility = document.documentElement.dataset.pageKind === 'utility';
  const view = document.defaultView!;
  const portrait = view.matchMedia('(max-aspect-ratio: 1/1)').matches;
  const motion = managedTimeline(document, (timeline) => {
    // Reduced route motion must not briefly paint an off-screen entrance pose.
    if (view.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (options.menuOpen) {
      // The page is already out of view. Only the visible menu surface leaves now.
      tween(timeline, document, 'dialog[open] .main-navigation', { opacity: 0, duration: 0.5 });
      return;
    }
    if (home) {
      if (portrait)
        splitPortrait(timeline, document, document.documentElement.dataset.homeSection, entering);
      else splitDesktop(timeline, document, entering);
      tween(
        timeline,
        document,
        '.section-controls',
        { '--controls-motion-x': '300%', color: '#333', duration: 0.5 },
        entering,
      );
    } else {
      const slide = !utility && (!entering || options.returning);
      tween(
        timeline,
        document,
        'main.content',
        { opacity: 0, ...(slide ? { xPercent: -100 } : {}), duration: slide ? 0.25 : 0.3 },
        entering,
      );
    }
    // Navigation stays in place. Only its colour changes for contrast while content is absent.
    tween(timeline, document, '#menu-trigger', { color: '#2b2c36', duration: 0.25 }, entering);
    tween(timeline, document, '.site-footer', { color: '#000', duration: 0.25 }, entering);
  });
  return { run: motion.open, destroy: motion.destroy };
}
