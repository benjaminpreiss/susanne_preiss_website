import { motionSteps, pageMotion, type PageKind } from './page-motion';
import { pageInteractions } from './page';
import { mountHomepage } from './homepage';

const installed = new WeakSet<Document>();
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
type InputModality = 'pointer' | 'keyboard';
function setInputModality(document: Document, modality: InputModality) {
  document.documentElement.dataset.inputModality = modality;
  try {
    document.defaultView?.sessionStorage.setItem('site.input-modality', modality);
  } catch {
    /* History state remains the storage-disabled fallback. */
  }
}
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
const kind = (document: Document): PageKind =>
  document.documentElement.dataset.pageKind === 'utility'
    ? 'utility'
    : document.documentElement.dataset.pageKind === 'home'
      ? 'home'
      : 'content';
type Motion = ReturnType<typeof pageMotion>;
interface Journey {
  id: number;
  from: string;
  to: string;
  fromKind: PageKind;
  fromLocale: string | undefined;
  fromIndex: number | undefined;
  navigationType: string;
  signal: AbortSignal;
  exit?: Motion;
  entry?: Motion;
  swapped: boolean;
  snapshotsFinished?: Promise<unknown>;
  cancel: () => void;
}

/** Install once for the document lifetime; Astro replaces bodies, not this controller. */
export function installPageNavigation(document: Document) {
  const view = document.defaultView;
  if (!view || installed.has(document)) return;
  installed.add(document);
  let homepageBody = document.body;
  let unmountHomepage = mountHomepage(document);
  function refreshHomepage() {
    if (homepageBody === document.body) return;
    unmountHomepage();
    homepageBody = document.body;
    unmountHomepage = mountHomepage(document);
  }
  document.addEventListener('astro:page-load', refreshHomepage);
  const state = (): Record<string, unknown> =>
    record(view.history.state) ? view.history.state : {};
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

  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = view.matchMedia('(pointer: coarse)');
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
        journey.exit?.restore();
        journey.entry?.restore();
        event.signal.removeEventListener('abort', journey.cancel);
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
        journey.exit = pageMotion(
          document,
          motionSteps(
            journey.fromKind,
            'exit',
            journey.fromKind === 'home'
              ? view.matchMedia('(max-aspect-ratio: 1/1)').matches
              : mobile.matches,
            menuOpen,
          ),
          false,
          reduced.matches,
        );
        emit(journey, 'exit-start');
        journey.exit.play();
        await journey.exit.finished;
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
    unmountHomepage();
    pageInteractions(document).setSection(null);
  });
  document.addEventListener('astro:after-swap', () => {
    const journey = active;
    if (!journey) return;
    journey.swapped = true;
    journey.exit?.restore();
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
    journey.entry = pageMotion(
      document,
      motionSteps(
        kind(document),
        'entry',
        kind(document) === 'home'
          ? view.matchMedia('(max-aspect-ratio: 1/1)').matches
          : mobile.matches,
        false,
        journey.fromKind === 'utility',
      ),
      true,
      reduced.matches,
    );
  });
  document.addEventListener('astro:page-load', () => {
    const journey = active;
    if (!journey?.swapped) {
      restoreInputModality(document);
      return;
    }
    void (async () => {
      await journey.snapshotsFinished;
      if (active !== journey || journey.signal.aborted) return;
      emit(journey, 'entry-start');
      journey.entry?.play();
      await journey.entry?.finished;
      if (active !== journey || journey.signal.aborted) return;
      journey.entry?.restore();
      document.documentElement.removeAttribute('data-route-phase');
      if (journey.navigationType === 'traverse' && typeof state().siteFocusId === 'string')
        restoreHistoryFocus(document);
      else document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
      journey.signal.removeEventListener('abort', journey.cancel);
      active = undefined;
      emit(journey, 'entry-end');
    })();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      active?.exit?.finish();
      active?.entry?.finish();
    }
  });
  view.addEventListener('pagehide', () => active?.cancel());
  view.addEventListener('pageshow', (event) => {
    if (event.persisted) restoreHistoryFocus(document);
  });
}
