import * as shared from './shared.js';
import * as contentEffects from './contentEffects.js';
import setupVideos from './setupVideo.js';
import $ from 'jquery';
import * as observer from './intersectionObserver.js';

let footerObserver;
let headerRightObserver;
let headerLeftObserver;

shared.addSharedEventListeners(false);
contentEffects.createEffectClasses();
setupVideos();

   

window.onload = (event) => {
    console.log('hello');
    footerObserver = observer.createFooterObserver();
    headerRightObserver = observer.createRightHeaderObserver();
    headerLeftObserver = observer.createLeftHeaderObserver();
}
window.onresize = (event) => {
        if( footerObserver ) {
            footerObserver.disconnect();
        }
        if( headerLeftObserver ) {
            headerLeftObserver.disconnect();
        }
        if( headerRightObserver ) {
            headerRightObserver.disconnect();
        }
        footerObserver = observer.updateFooterObserver();
        headerRightObserver = observer.updateRightHeaderObserver();
        headerLeftObserver = observer.updateLeftHeaderObserver();
}