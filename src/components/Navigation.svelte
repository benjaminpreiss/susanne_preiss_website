<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { gsap } from 'gsap';
  import type { UIStrings } from '../lib/content/ui';
  import type { navigationModel } from '../lib/content/navigation';
  import { pageInteractions, type SectionState } from '../interactions/page';
  import { restoreHistoryFocus } from '../interactions/navigation';
  import { homeContentSteps } from '../interactions/page-motion';

  interface Props {
    strings: UIStrings;
    navigation: ReturnType<typeof navigationModel>;
    heroTone?: 'light' | 'dark';
    isHome?: boolean;
  }
  let { strings, navigation, heroTone = 'light', isHome = false }: Props = $props();
  const id = $props.id();
  let active = $state(false);
  let ready = $state(false);
  let headerTone = $state<boolean | null>(null);
  let lightHeader = $derived(
    headerTone ?? (!isHome && !navigation.isUtility && heroTone === 'light'),
  );
  let lightFooter = $state(false);
  let overlayHeader = $state(true);
  let overlayFooter = $state(false);
  let dialog: HTMLDialogElement;
  let opener: HTMLElement | null = null;
  let releaseScroll: (() => void) | undefined;
  let animation: gsap.Context | undefined;
  let transition: gsap.core.Timeline | undefined;
  let section: SectionState | null = null;
  let closing = false;
  let departing = false;

  function updateColors() {
    if (active || departing) return;
    const hero = document.querySelector('.hero')?.getBoundingClientRect();
    overlayHeader = isHome || !!(hero && hero.top <= 30 && hero.bottom > 60);
    overlayFooter =
      isHome || !!(hero && hero.top < window.innerHeight - 40 && hero.bottom >= window.innerHeight);
    headerTone = section?.lightHeader ?? (overlayHeader && heroTone === 'light');
    lightFooter = section?.lightFooter ?? (overlayFooter && heroTone === 'light');
  }
  onMount(() => {
    ready = true;
    // A history swap may complete before this island enables its menu button.
    void tick().then(() => {
      if (document.body.dataset.restoreFocus) restoreHistoryFocus(document);
    });
    const departure = () => {
      departing = true;
      transition?.pause();
    };
    const abortDeparture = () => {
      departing = false;
      if (active) {
        if (closing) transition?.reverse();
        else transition?.play();
      }
    };
    const exitComplete = () => {
      departing = false;
      finishClose(false);
    };
    document.addEventListener('site:page-departure', departure);
    document.addEventListener('site:page-cancel', abortDeparture);
    document.addEventListener('site:page-exit-complete', exitComplete);
    const unsubscribe = pageInteractions(document).subscribe((state) => {
      section = state.section;
      updateColors();
    });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopMotion = () => {
      if (!media.matches) return;
      if (closing) finishClose();
      else {
        animation?.revert();
        transition = undefined;
      }
    };
    media.addEventListener('change', stopMotion);
    return () => {
      animation?.revert();
      if (dialog?.open) dialog.close();
      releaseScroll?.();
      unsubscribe();
      media.removeEventListener('change', stopMotion);
      document.removeEventListener('site:page-departure', departure);
      document.removeEventListener('site:page-cancel', abortDeparture);
      document.removeEventListener('site:page-exit-complete', exitComplete);
    };
  });
  async function open() {
    if (active || closing || departing) return;
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    releaseScroll = pageInteractions(document).lockScroll();
    active = true;
    await tick();
    if (!active) return;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[data-dismiss]')?.focus({ preventScroll: true });
    animation = gsap.context(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const timeline = gsap.timeline({ onReverseComplete: finishClose });
      transition = timeline;
      // Finish the outgoing content/controls before revealing the menu surface.
      // Reversing the same timeline also keeps closing sequential and interruptible.
      timeline.from(
        dialog.querySelector('.main-navigation'),
        { opacity: 0, duration: reduce ? 0 : 0.5 },
        reduce ? 0 : isHome ? 0.7 : 0.5,
      );
      if (isHome) {
        for (const step of homeContentSteps(window.matchMedia('(max-aspect-ratio: 1/1)').matches)) {
          timeline.to(
            document.querySelectorAll(step.selector),
            { ...step.pose, duration: reduce ? 0 : step.duration, ease: 'power1.inOut' },
            0,
          );
        }
        timeline.to(
          document.querySelectorAll('.section-controls'),
          { xPercent: 300, color: '#333', duration: reduce ? 0 : 0.5 },
          0,
        );
        timeline.to(
          document.querySelectorAll('.site-footer'),
          { color: '#000', duration: reduce ? 0 : 0.4 },
          0,
        );
        timeline.fromTo(
          dialog.querySelector('.dismiss-menu'),
          { color: lightHeader ? '#efeae3' : '#2b2c36' },
          { color: '#2b2c36', duration: reduce ? 0 : 0.4 },
          0,
        );
      } else {
        timeline.to(
          document.querySelectorAll('main.content'),
          { xPercent: -100, opacity: 0, duration: reduce ? 0 : 0.25, ease: 'power1.inOut' },
          0,
        );
      }
      timeline.to(
        document.querySelectorAll('.site-footer'),
        { yPercent: 300, duration: reduce ? 0 : 0.5, ease: 'power1.inOut' },
        0,
      );
      timeline.to(
        document.querySelectorAll('.header-background'),
        { xPercent: -100, duration: reduce ? 0 : 0.25 },
        0,
      );
      const homes = document.querySelectorAll('.site-header .home');
      if (homes.length) timeline.to(homes, { xPercent: -300, duration: reduce ? 0 : 0.25 }, 0);
      timeline.from(
        dialog.querySelectorAll('.dismiss-menu span:nth-child(1)'),
        { rotation: 0, top: 0, duration: reduce ? 0 : 0.4 },
        0,
      );
      timeline.from(
        dialog.querySelectorAll('.dismiss-menu span:nth-child(2)'),
        { opacity: 1, duration: reduce ? 0 : 0.2 },
        0,
      );
      timeline.from(
        dialog.querySelectorAll('.dismiss-menu span:nth-child(3)'),
        { rotation: 0, top: '90%', duration: reduce ? 0 : 0.4 },
        0,
      );
    });
  }
  function close() {
    if (!active || closing || departing) return;
    closing = true;
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !transition ||
      transition.time() === 0
    ) {
      finishClose();
      return;
    }
    // One reversible timeline preserves original styles even when interrupted.
    transition.reverse();
  }
  function finishClose(restoreFocus = true) {
    if (!active) return;
    animation?.revert();
    animation = undefined;
    transition = undefined;
    active = false;
    closing = false;
    dialog?.close();
    releaseScroll?.();
    releaseScroll = undefined;
    if (restoreFocus) opener?.focus({ preventScroll: true });
    updateColors();
  }
  function cancel(event: Event) {
    event.preventDefault();
    close();
  }
  function trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')];
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
</script>

<svelte:window
  onscroll={updateColors}
  onresize={updateColors}
  onpagehide={() => finishClose(false)}
  onpageshow={updateColors}
/>
{#if !navigation.isUtility}
  <header
    class={['site-header', { 'light-controls': lightHeader, 'image-overlay': overlayHeader }]}
    data-menu-open={active ? 'true' : undefined}
  >
    <span class="header-background" aria-hidden="true"></span>
    {#if navigation.home && !isHome}<a
        class="home"
        href={navigation.home}
        aria-label={strings.home}
        id="nav-home"
      ></a>{/if}
    <button
      id="menu-trigger"
      class="menu"
      disabled={!ready}
      aria-label={strings.menu}
      aria-haspopup="dialog"
      aria-controls={id}
      aria-expanded={active}
      onclick={open}><span></span><span></span><span></span></button
    >
  </header>
{/if}
{#if navigation.languages.length}
  <nav class="language-links" aria-label={strings.language}>
    {#each navigation.languages as language (language.locale)}
      <a
        id={`language-${language.locale}`}
        lang={language.locale}
        hreflang={language.locale}
        href={language.href}>{language.label}</a
      >
    {/each}
  </nav>
{/if}
<footer
  class={['site-footer', { 'light-controls': lightFooter, 'image-overlay': overlayFooter }]}
  data-menu-open={active ? 'true' : undefined}
>
  {#if navigation.isUtility}
    <a
      class="contact return-link"
      id="page-return"
      data-return
      href={navigation.returnHref}
      title={strings.back}>{strings.close}</a
    >
  {:else}
    <div class="legal">
      {#each navigation.footer.legal as link (link.key)}
        <a
          id={`footer-${link.key}`}
          href={link.href}
          aria-current={link.current ? 'page' : undefined}>{link.label}</a
        >
      {/each}
    </div>
    <a
      class="contact"
      id={`footer-${navigation.footer.primary.key}`}
      href={navigation.footer.primary.href}
      aria-current={navigation.footer.primary.current ? 'page' : undefined}
      >{navigation.footer.primary.label}</a
    >
  {/if}
</footer>
<dialog
  bind:this={dialog}
  {id}
  class="shared-dialog"
  aria-label={strings.menu}
  oncancel={cancel}
  onclose={() => {
    if (!dialog?.open) finishClose();
  }}
  onkeydown={trapFocus}
>
  <nav class="main-navigation" aria-label={strings.menu}>
    {#each navigation.links as link (link.href)}
      <a href={link.href} aria-current={link.current ? 'page' : undefined}>{link.label}</a>
    {/each}
  </nav>
  <button class="menu dismiss-menu" data-dismiss aria-label={strings.close} onclick={close}
    ><span></span><span></span><span></span></button
  >
</dialog>
