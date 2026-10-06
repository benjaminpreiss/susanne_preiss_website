<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { UIStrings } from '../lib/content/ui';
  import type { navigationModel } from '../lib/content/navigation';
  import { pageInteractions, type SectionState } from '../interactions/page';
  import { restoreHistoryFocus } from '../interactions/navigation';
  import { createMenuMotion } from '../interactions/motion';

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
  let menuMotion: ReturnType<typeof createMenuMotion> | undefined;
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
      menuMotion?.pause();
    };
    const abortDeparture = () => {
      departing = false;
      // A reduced-motion change may have settled a paused close during departure.
      // Re-requesting close also handles that endpoint without restarting the animation.
      if (closing) {
        closing = false;
        void close();
      } else menuMotion?.resume();
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
    return () => {
      menuMotion?.destroy();
      menuMotion = undefined;
      if (dialog?.open) dialog.close();
      releaseScroll?.();
      unsubscribe();
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
    if (!active || departing) return;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[data-dismiss]')?.focus({ preventScroll: true });
    menuMotion = createMenuMotion(document, dialog, { sectionKey: section?.key, lightHeader });
    void menuMotion.open();
  }
  async function close() {
    if (!active || closing || departing) return;
    closing = true;
    const motion = menuMotion;
    await motion?.close();
    // A route departure or unmount can supersede this close while its timeline is running.
    if (menuMotion === motion && active && !departing) finishClose();
  }
  function finishClose(restoreFocus = true) {
    if (!active) return;
    menuMotion?.destroy();
    menuMotion = undefined;
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
