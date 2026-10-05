export interface SectionState {
  key: string;
  lightHeader: boolean;
  lightFooter: boolean;
}
export interface InteractionState {
  section: SectionState | null;
  scrollLocked: boolean;
}

/** One controller per document; ticket 04 publishes section state here, not body classes. */
const controllers = new WeakMap<Document, ReturnType<typeof createInteractions>>();
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
    subscribe(subscriber: (state: InteractionState) => void) {
      subscribers.add(subscriber);
      subscriber(state());
      return () => {
        subscribers.delete(subscriber);
      };
    },
    setSection(value: SectionState | null) {
      section = value;
      notify();
    },
    lockScroll() {
      const token = Symbol();
      if (!locks.size) {
        const view = document.defaultView;
        const body = document.body;
        const x = view?.scrollX ?? 0;
        const y = view?.scrollY ?? 0;
        const properties = ['position', 'top', 'left', 'width', 'overflow'] as const;
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
