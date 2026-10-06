import { gsap } from 'gsap';

export type PageKind = 'content' | 'utility' | 'home';
interface Pose {
  opacity?: number;
  xPercent?: number;
  yPercent?: number;
  y?: string | number;
  color?: string;
}
export interface MotionStep {
  selector: string;
  pose: Pose;
  duration: number;
}

/** Panels own departure transforms; the nested links own hover/focus scale. */
export function homeContentSteps(mobile: boolean): MotionStep[] {
  return mobile
    ? [{ selector: '.homepage', pose: { y: '-100vh', opacity: 0 }, duration: 0.7 }]
    : [
        { selector: '.home-image.home-left', pose: { xPercent: -100, opacity: 0 }, duration: 0.5 },
        { selector: '.home-image.home-right', pose: { xPercent: 100, opacity: 0 }, duration: 0.5 },
        { selector: '.home-copy.home-left', pose: { xPercent: -100 }, duration: 0.7 },
        { selector: '.home-copy.home-right', pose: { xPercent: 100 }, duration: 0.7 },
      ];
}

/** Menu opening splits portrait panels; route changes retain whole-page motion. */
export function homeMenuContentSteps(mobile: boolean): MotionStep[] {
  return mobile
    ? [
        { selector: '.home-image', pose: { y: '-100vh', opacity: 0 }, duration: 0.7 },
        { selector: '.home-copy', pose: { y: '100vh', opacity: 0 }, duration: 0.7 },
      ]
    : homeContentSteps(false);
}

/** Homepage motion never inherits the content-page leftward exit or mobile toggle fade. */
export function motionSteps(
  kind: PageKind,
  phase: 'exit' | 'entry',
  mobile: boolean,
  menuOpen = false,
  returning = false,
): MotionStep[] {
  if (menuOpen)
    return [
      { selector: 'dialog[open] .main-navigation', pose: { opacity: 0 }, duration: 0.5 },
      {
        selector: 'dialog[open] .dismiss-menu',
        pose: mobile && kind !== 'home' ? { opacity: 0 } : { xPercent: 300 },
        duration: 0.5,
      },
    ];
  if (kind === 'home')
    return [
      ...homeContentSteps(mobile),
      { selector: '#menu-trigger', pose: { xPercent: 300, color: '#2b2c36' }, duration: 0.5 },
      { selector: '.section-controls', pose: { xPercent: 300, color: '#333' }, duration: 0.5 },
      { selector: '.site-footer', pose: { color: '#000' }, duration: 0.4 },
      { selector: '.site-footer .legal a', pose: { yPercent: 500 }, duration: 0.5 },
      {
        selector: '#footer-contact',
        pose: { yPercent: 200 },
        duration: phase === 'exit' ? 0.35 : 0.5,
      },
      { selector: '.language-links', pose: { opacity: 0 }, duration: 0.25 },
    ];
  const steps: MotionStep[] = [
    {
      selector: 'main.content',
      pose:
        kind === 'content' && (phase === 'exit' || returning)
          ? { opacity: 0, xPercent: -100 }
          : { opacity: 0 },
      duration: kind === 'content' && (phase === 'exit' || returning) ? 0.25 : 0.3,
    },
  ];
  if (kind === 'utility')
    steps.push({ selector: '#page-return', pose: { opacity: 0 }, duration: 0.35 });
  else
    steps.push(
      { selector: '.header-background', pose: { xPercent: -100 }, duration: 0.25 },
      { selector: '.site-header .home', pose: { xPercent: -300 }, duration: 0.25 },
      {
        selector: '#menu-trigger',
        pose: mobile ? { opacity: 0 } : { xPercent: 300 },
        duration: 0.5,
      },
      { selector: '.site-footer .legal a', pose: { yPercent: 500 }, duration: 0.5 },
      {
        selector: '#footer-contact',
        pose: { yPercent: 200 },
        duration: phase === 'exit' ? 0.35 : 0.5,
      },
    );
  steps.push({ selector: '.language-links', pose: { opacity: 0 }, duration: 0.25 });
  return steps;
}

/** One owner for each stage. Cancellation resolves the waiter and restores original styles. */
export function pageMotion(
  document: Document,
  steps: MotionStep[],
  entering: boolean,
  reduced: boolean,
) {
  let resolve: () => void = () => {};
  const finished = new Promise<void>((done) => {
    resolve = done;
  });
  let timeline: gsap.core.Timeline | undefined;
  const context = gsap.context(() => {
    const stage = gsap.timeline({ paused: true, onComplete: () => resolve() });
    timeline = stage;
    if (reduced) return;
    for (const step of steps) {
      const targets = document.querySelectorAll<HTMLElement>(step.selector);
      if (!targets.length) continue;
      // `from` captures the destination's authored section colours and resting pose.
      if (entering)
        stage.from(
          targets,
          {
            ...step.pose,
            duration: step.duration,
            ease: 'power1.inOut',
            immediateRender: true,
          },
          0,
        );
      else stage.to(targets, { ...step.pose, duration: step.duration, ease: 'power1.inOut' }, 0);
    }
  });
  return {
    finished,
    play() {
      if (reduced || !timeline || timeline.duration() === 0) resolve();
      else timeline.play();
    },
    finish() {
      timeline?.progress(1);
      resolve();
    },
    restore() {
      context.revert();
      resolve();
    },
  };
}
