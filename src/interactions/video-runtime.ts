/**
 * Lazy, side-effect-only Video.js registration entry, imported by VideoPlayer.svelte
 * when its player approaches the viewport. Keeping these imports out of the shell
 * defers the heavier player, Compat skin, HLS adapter and locale registrations.
 * Module caching shares registration across players; the Svelte shell owns each
 * player's DOM and teardown when ClientRouter replaces the body.
 * @module
 */
import '@videojs/html/video/player';
import '@videojs/html/video/compat-skin';
import '@videojs/html/media/hlsjs-video';
import '@videojs/html/i18n';
import '@videojs/html/i18n/locales/de/register';
