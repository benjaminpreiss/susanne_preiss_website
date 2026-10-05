<script lang="ts">
  import { onMount, tick } from 'svelte';
  import '@videojs/html/video/player';
  import '@videojs/html/video/compat-skin';
  import '@videojs/html/media/hlsjs-video';
  import '@videojs/html/i18n';
  import '@videojs/html/i18n/locales/de/register';
  import type { VideoPlayerElement } from '@videojs/html/video';
  import type { HlsJsVideoElement } from '@videojs/html/media/hlsjs-video';
  import type { Locale } from '../lib/content/schema';
  import type { VideoProps } from '../lib/content/editorial';
  import type { UIStrings } from '../lib/content/ui';

  type Media = Pick<
    VideoProps,
    | 'id'
    | 'src'
    | 'poster'
    | 'title'
    | 'mediaLocale'
    | 'captionSrc'
    | 'captionLocale'
    | 'captionLabel'
  >;
  interface Props {
    media: Media;
    locale: Locale;
    strings: Pick<UIStrings, 'play' | 'videoUnavailable'>;
  }
  let { media, locale, strings }: Props = $props();
  let enhanced = $state(false);
  let started = $state(false);
  let failure = $state(false);
  let ready = $state(false);
  let attempt = $state(0);
  let launch = $state<HTMLButtonElement>();
  let player = $state<VideoPlayerElement>();
  let playback = $state<HlsJsVideoElement>();

  onMount(() => {
    enhanced = true;
  });

  // Svelte owns light DOM; each v10 component owns its shadow DOM and engine.
  // No keep-alive: removal destroys the engine in a microtask and the store after two frames.
  function mediaLifecycle(element: HlsJsVideoElement) {
    started = false;
    failure = false;
    return () => {
      element.pause();
    };
  }

  function observePlayer(element: VideoPlayerElement) {
    const sync = () => {
      ready = !!element.store.target;
    };
    sync();
    return element.store.subscribe(sync);
  }

  async function restoreCover() {
    const current = player;
    const restoreFocus = current?.contains(document.activeElement);
    if (document.fullscreenElement && current?.contains(document.fullscreenElement))
      await document.exitFullscreen();
    if (player !== current) return;
    started = false;
    if (restoreFocus) {
      await tick();
      launch?.focus({ preventScroll: true });
    }
  }

  function failed() {
    failure = true;
    void restoreCover();
  }

  async function play() {
    if (started) return;
    if (player?.store.error || playback?.error) {
      // A fatal HLS error needs a fresh media engine, not a native-video load().
      attempt += 1;
      await tick();
    }
    const current = player;
    const element = playback;
    if (!current || !element || !current.store.target) return;
    failure = false;
    started = true;
    // Preserve trusted activation: covers animate, but play isn't delayed by a timer.
    try {
      await current.store.play();
      if (player === current && current.isConnected) element.focus({ preventScroll: true });
    } catch {
      if (player !== current || !current.isConnected) return;
      failure = true;
      await restoreCover();
      launch?.focus({ preventScroll: true });
    }
  }
</script>

<svelte:window onpagehide={() => playback?.pause()} />

<div class="media-player" data-enhanced={enhanced || undefined} data-started={started || undefined}>
  {#if enhanced}
    <media-i18n lang={locale}>
      {#key `${media.src}:${attempt}`}
        <video-player bind:this={player} poster={media.poster} {@attach observePlayer}>
          <video-compat-skin inert={!started}>
            <hlsjs-video
              bind:this={playback}
              src={media.src}
              playsinline
              preload="auto"
              crossorigin="anonymous"
              lang={media.mediaLocale}
              aria-label={media.title}
              tabindex="-1"
              onended={restoreCover}
              onerror={failed}
              {@attach mediaLifecycle}
            >
              {#if media.captionSrc}
                <track
                  kind="captions"
                  src={media.captionSrc}
                  srclang={media.captionLocale}
                  label={media.captionLabel}
                />
              {/if}
            </hlsjs-video>
          </video-compat-skin>
        </video-player>
      {/key}
    </media-i18n>
    {#if media.poster}<img class="video-initial-poster" src={media.poster} alt="" />{/if}
    <div class="video-launch" inert={started}>
      <button
        bind:this={launch}
        class="video-play"
        disabled={!ready}
        aria-label={`${strings.play}: ${media.title}`}
        onclick={play}
      ></button>
    </div>
  {:else}
    <video
      class="native-video"
      controls
      preload="none"
      playsinline
      poster={media.poster}
      aria-label={media.title}
      lang={media.mediaLocale}
    >
      <source src={media.src} type="application/x-mpegURL" />
      {#if media.captionSrc}
        <track
          kind="captions"
          src={media.captionSrc}
          srclang={media.captionLocale}
          label={media.captionLabel}
        />
      {/if}
      {strings.videoUnavailable}
    </video>
  {/if}
  <div class="video-status" role="status">{failure ? strings.videoUnavailable : ''}</div>
</div>
