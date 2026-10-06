/**
 * Document-lifetime integration with Astro ClientRouter. Keeps ordinary links,
 * history and focus semantics while awaiting the shared motion module's timelines.
 * motion.ts owns choreography; this module owns the points where loading, swapping
 * and interaction cleanup must agree.
 * @module
 */
import { createPageMotion } from './motion';
import { pageInteractions } from './page';
import { mountHomepage } from './homepage';

const installed = new WeakSet<Document>();
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
type InputModality = 'pointer' | 'keyboard';
/** Preserve whether restored focus should show keyboard affordances after a route swap. */
function setInputModality(document: Document, modality: InputModality) {
  document.documentElement.dataset.inputModality = modality;
  try {
    document.defaultView?.sessionStorage.setItem('site.input-modality', modality);
  } catch {
    /* History state remains the storage-disabled fallback. */
  }
}
/** Prefer session continuity, but remain usable when browser storage is unavailable. */
function restoreInputModality(document: Document, fallback?: unknown) {
  let modality = fallback;
  try {
    modality = document.defaultView?.sessionStorage.getItem('site.input-modality') ?? fallback;
  } catch {
    /* Use the saved entry mode. */
  }
  if (modality === 'pointer' || modality === 'keyboard')
    document.documentElement.dataset.inputModality = modality;
}
/**
 * Return focus to the control saved for the current history entry without moving scroll.
 * Do not steal focus if the user or another island already selected a different control.
 * A late-hydrating navigation island may retry this once its opener becomes enabled.
 */
export function restoreHistoryFocus(document: Document) {
  const state: unknown = document.defaultView?.history.state;
  if (!record(state) || typeof state.siteFocusId !== 'string') return;
  const element = document.getElementById(state.siteFocusId);
  if (!element || element.matches(':disabled')) return;
  if (
    document.activeElement === document.body ||
    document.activeElement === document.documentElement ||
    document.activeElement === element
  ) {
    restoreInputModality(
      document,
      document.documentElement.dataset.inputModality ?? state.siteFocusModality,
    );
    element.focus({ preventScroll: true });
  }
}
type PageKind = 'content' | 'utility' | 'home';
const kind = (document: Document): PageKind =>
  document.documentElement.dataset.pageKind === 'utility'
    ? 'utility'
    : document.documentElement.dataset.pageKind === 'home'
      ? 'home'
      : 'content';
/** One navigation attempt; its identity prevents late async work from mutating a newer route. */
interface Journey {
  id: number;
  from: string;
  to: string;
  fromKind: PageKind;
  fromLocale: string | undefined;
  fromIndex: number | undefined;
  navigationType: string;
  signal: AbortSignal;
  // Exit and entry run sequentially; each stage is destroyed before replacing it.
  motion?: ReturnType<typeof createPageMotion>;
  swapped: boolean;
  snapshotsFinished?: Promise<unknown>;
  cancel: () => void;
}

/**
 * Install once per document; repeated calls do not add duplicate route listeners.
 *
 * Lifecycle order:
 * - before-preparation: finish loading the destination before hiding the current page;
 * - before-swap: suppress snapshot animations and unmount body-scoped enhancements;
 * - after-swap: restore section presentation and establish the entrance pose;
 * - page-load: await entrance completion, release route state and restore focus.
 *
 * JavaScript is needed at these lifecycle boundaries, not to render animation frames.
 * The homepage itself is remounted per body; document-level listeners persist until
 * the document is discarded. pagehide cancels any unfinished navigation.
 *
 * @param document Live document managed by Astro ClientRouter.
 */
export function installPageNavigation(document: Document) {
  const view = document.defaultView;
  if (!view || installed.has(document)) return;
  installed.add(document);
  let homepageBody = document.body;
  let unmountHomepage = mountHomepage(document);
  /** Rebind body-owned listeners only after replacement, never during the same body's entrance. */
  function refreshHomepage() {
    if (homepageBody === document.body) return;
    unmountHomepage();
    homepageBody = document.body;
    unmountHomepage = mountHomepage(document);
  }
  document.addEventListener('astro:page-load', refreshHomepage);
  const state = (): Record<string, unknown> =>
    record(view.history.state) ? view.history.state : {};
  // Restrict our history/focus bookkeeping to published same-origin destinations.
  const allowed = (href: string) => {
    try {
      const url = new URL(href, view.location.href);
      const paths: unknown = JSON.parse(document.body.dataset.publishedPaths ?? '[]');
      return (
        url.origin === view.location.origin && Array.isArray(paths) && paths.includes(url.pathname)
      );
    } catch {
      return false;
    }
  };
  restoreInputModality(document);
  document.addEventListener('pointerdown', () => setInputModality(document, 'pointer'), true);
  document.addEventListener(
    'keydown',
    (event) => {
      if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key))
        setInputModality(document, 'keyboard');
    },
    true,
  );
  // Capture before ClientRouter's bubbling listener. Do not mutate Svelte-owned hrefs.
  document.addEventListener(
    'click',
    (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        (link.target && link.target !== '_self') ||
        link.hasAttribute('download') ||
        !allowed(link.href)
      )
        return;
      const modality = event.detail > 0 ? 'pointer' : 'keyboard';
      setInputModality(document, modality);
      const focusId = link.closest('dialog') ? 'menu-trigger' : link.id;
      if (focusId)
        view.history.replaceState(
          { ...state(), siteFocusId: focusId, siteFocusModality: modality },
          '',
        );
      // Use Back only for the immediately preceding, known utility opener.
      // A direct load or unrelated history entry must retain the ordinary return href.
      const back = state().siteReturn;
      if (
        link.hasAttribute('data-return') &&
        record(back) &&
        typeof back.href === 'string' &&
        allowed(back.href) &&
        typeof back.index === 'number' &&
        state().index === back.index + 1
      ) {
        event.preventDefault();
        view.history.back();
      }
    },
    true,
  );

  // Diagnostic event metadata only; the motion module implements reduced-motion playback.
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  let active: Journey | undefined;
  let sequence = 0;
  const emit = (journey: Journey, stage: string) =>
    document.dispatchEvent(
      new CustomEvent('site:page-transition', {
        detail: {
          id: journey.id,
          stage,
          from: journey.from,
          to: journey.to,
          time: performance.now(),
          reduced: reduced.matches,
        },
      }),
    );
  document.addEventListener('astro:before-preparation', (event) => {
    active?.cancel();
    const index = state().index;
    const journey: Journey = {
      id: ++sequence,
      from: event.from.href,
      to: event.to.href,
      fromKind: kind(document),
      fromLocale: document.body.dataset.locale,
      fromIndex:
        typeof index === 'number' && event.from.href === view.location.href ? index : undefined,
      navigationType: event.navigationType,
      signal: event.signal,
      swapped: false,
      cancel() {
        journey.motion?.destroy();
        journey.motion = undefined;
        event.signal.removeEventListener('abort', journey.cancel);
        // A superseded loader can finish late; it must not clear the new journey's route state.
        if (active !== journey) return;
        document.documentElement.removeAttribute('data-route-phase');
        document.dispatchEvent(new Event('site:page-cancel'));
        active = undefined;
        emit(journey, 'cancelled');
      },
    };
    active = journey;
    document.documentElement.dataset.routePhase = 'loading';
    event.signal.addEventListener('abort', journey.cancel, { once: true });
    const load = event.loader;
    event.loader = async () => {
      try {
        // Fetch/parse/preload first, so a slow or failed request does not blank the page.
        await load();
        if (event.signal.aborted || event.defaultPrevented || active !== journey) {
          journey.cancel();
          return;
        }
        journey.to = event.to.href;
        document.dispatchEvent(new Event('site:page-departure'));
        const menuOpen = !!document.querySelector('dialog[open]');
        document.documentElement.dataset.routePhase = 'leaving';
        journey.motion = createPageMotion(document, { entering: false, menuOpen });
        emit(journey, 'exit-start');
        await journey.motion.run();
        if (event.signal.aborted || active !== journey) return;
        emit(journey, 'exit-end');
        // Keep the completed exit hidden while menu teardown restores its scroll lock.
        // Astro then records the correct source scroll before swapping the body.
        document.documentElement.dataset.routePhase = 'swapping';
        document.dispatchEvent(new Event('site:page-exit-complete'));
      } catch {
        journey.cancel();
        event.preventDefault(); // Astro falls back to ordinary document navigation.
      }
    };
  });
  document.addEventListener('astro:before-swap', (event) => {
    // ClientRouter supplies the swap/history lifecycle, not the animation snapshots.
    void event.viewTransition.ready.catch(() => undefined);
    event.viewTransition.skipTransition();
    const journey = active;
    if (!journey) return;
    journey.snapshotsFinished = event.viewTransition.finished.catch(() => undefined);
    event.newDocument.documentElement.dataset.routePhase = 'entering';
    const mode = document.documentElement.dataset.inputModality;
    if (mode) event.newDocument.documentElement.dataset.inputModality = mode;
    if (journey.navigationType === 'traverse') event.newDocument.body.dataset.restoreFocus = 'true';
    journey.motion?.destroy();
    journey.motion = undefined;
    unmountHomepage();
    pageInteractions(document).setSection(null);
  });
  document.addEventListener('astro:after-swap', () => {
    const journey = active;
    if (!journey) return;
    journey.swapped = true;
    const currentIndex = state().index;
    if (
      kind(document) === 'utility' &&
      journey.navigationType === 'push' &&
      journey.fromLocale === document.body.dataset.locale &&
      journey.fromIndex !== undefined &&
      currentIndex === journey.fromIndex + 1 &&
      allowed(journey.from)
    ) {
      view.history.replaceState(
        { ...state(), siteReturn: { href: journey.from, index: journey.fromIndex } },
        '',
      );
    }
    restoreInputModality(document, document.documentElement.dataset.inputModality);
    // Astro has restored scroll now. Establish colours before capturing entry poses;
    // do not remount on page-load while those entry transforms are active.
    refreshHomepage();
    // Set entry poses synchronously, before the replacement body can paint.
    journey.motion = createPageMotion(document, {
      entering: true,
      returning: journey.fromKind === 'utility',
    });
  });
  document.addEventListener('astro:page-load', () => {
    const journey = active;
    if (!journey?.swapped) {
      restoreInputModality(document);
      return;
    }
    void (async () => {
      // Even skipped View Transitions have a lifecycle; avoid competing with its final cleanup.
      await journey.snapshotsFinished;
      if (active !== journey || journey.signal.aborted) return;
      emit(journey, 'entry-start');
      await journey.motion?.run();
      if (active !== journey || journey.signal.aborted) return;
      journey.motion?.destroy();
      journey.motion = undefined;
      document.documentElement.removeAttribute('data-route-phase');
      if (journey.navigationType === 'traverse' && typeof state().siteFocusId === 'string')
        restoreHistoryFocus(document);
      else document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
      journey.signal.removeEventListener('abort', journey.cancel);
      active = undefined;
      emit(journey, 'entry-end');
    })();
  });
  view.addEventListener('pagehide', () => active?.cancel());
  view.addEventListener('pageshow', (event) => {
    if (event.persisted) restoreHistoryFocus(document);
  });
}
