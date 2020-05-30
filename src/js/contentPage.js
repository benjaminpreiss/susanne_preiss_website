import * as shared from './shared.js';
import * as contentEffects from './contentEffects.js';
import setupVideos from './setupVideo.js';
import $ from 'jquery';
import * as observer from './intersectionObserver.js';

let footerObserver;
let headerRightObserver;
let headerLeftObserver;

shared.addSharedEventListeners(false);
$( window ).on( 'load', function() {
    footerObserver = observer.createFooterObserver();
    headerRightObserver = observer.createRightHeaderObserver();
    headerLeftObserver = observer.createLeftHeaderObserver();
    setupVideos();
    contentEffects.createEffectClasses();
})
$( window ).on( 'resize', function() {
    footerObserver.disconnect();
    headerRightObserver.disconnect();
    headerLeftObserver.disconnect();
    footerObserver = observer.updateFooterObserver();
    headerRightObserver = observer.updateRightHeaderObserver();
    headerLeftObserver = observer.updateLeftHeaderObserver();
})