/**
 * Document-scoped coordination between the homepage and navigation island.
 * Shares section identity and modal scroll locks, not animation poses or timings.
 * The document persists across body swaps; subscribers and locks must be released
 * by their body-scoped owners before those owners are destroyed.
 * @module
 */

/** Authored identity and control tones of the active homepage section. */
export interface SectionState {
  key: string;
  lightHeader: boolean;
  lightFooter: boolean;
}
/** Snapshot delivered to subscribers; a null section means no mounted homepage selection. */
export interface InteractionState {
  section: SectionState | null;
  scrollLocked: boolean;
}

const controllers = new WeakMap<Document, ReturnType<typeof createInteractions>>();
/**
 * Return the shared coordinator for this document without retaining discarded documents.
 * Reusing it across ClientRouter body swaps keeps lock and section notifications consistent.
 */
export function pageInteractions(document: Document) {
  let controller = controllers.get(document);
  if (!controller) {
    controller = createInteractions(document);
    controllers.set(document, controller);
  }
  return controller;
}
function createInteractions(document: Document) {
  let section: SectionState | null = null;
  const locks = new Set<symbol>();
  const subscribers = new Set<(state: InteractionState) => void>();
  let restore: (() => void) | undefined;
  const state = (): InteractionState => ({ section, scrollLocked: locks.size > 0 });
  const notify = () => subscribers.forEach((subscriber) => subscriber(state()));
  return {
    /** Deliver current state immediately (islands can mount late); return an unsubscribe function. */
    subscribe(subscriber: (state: InteractionState) => void) {
      subscribers.add(subscriber);
      subscriber(state());
      return () => {
        subscribers.delete(subscriber);
      };
    },
    /** Publish the current authored section, or null when its homepage body is unmounted. */
    setSection(value: SectionState | null) {
      section = value;
      notify();
    },
    /**
     * Freeze the current body for a modal dialog while preserving its visual scroll position.
     * Each caller owns one token; only the last release restores styles and scroll coordinates.
     * Release before a body swap so Astro records real scroll coordinates, not the fixed body's.
     *
     * @returns Idempotent release function; releasing another owner's lock is not possible.
     */
    lockScroll() {
      const token = Symbol();
      if (!locks.size) {
        const view = document.defaultView;
        const body = document.body;
        const x = view?.scrollX ?? 0;
        const y = view?.scrollY ?? 0;
        const properties = ['position', 'top', 'left', 'width', 'overflow'] as const;
        // Preserve only properties we own, including priorities; do not replace the entire style attribute.
        const previous = properties.map(
          (name) =>
            [
              name,
              body.style.getPropertyValue(name),
              body.style.getPropertyPriority(name),
            ] as const,
        );
        body.style.position = 'fixed';
        body.style.top = `${-y}px`;
        body.style.left = `${-x}px`;
        body.style.width = '100%';
        body.style.overflow = 'hidden';
        restore = () => {
          for (const [name, value, priority] of previous) {
            if (value) body.style.setProperty(name, value, priority);
            else body.style.removeProperty(name);
          }
          view?.scrollTo({ left: x, top: y, behavior: 'instant' });
        };
      }
      locks.add(token);
      notify();
      return () => {
        if (!locks.delete(token)) return;
        if (!locks.size) {
          restore?.();
          restore = undefined;
        }
        notify();
      };
    },
  };
}
