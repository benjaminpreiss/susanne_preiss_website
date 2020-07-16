import * as shared from './shared.js';
import * as contentEffects from './contentEffects.js';
import setupVideos from './setupVideo.js';
import $ from 'jquery';
import * as observer from './intersectionObserver.js';
import '../../node_modules/waypoints/lib/noframework.waypoints.js';

let footerObserver;
let headerRightObserver;
let headerLeftObserver;
let waypoint = new Waypoint({
    element: $( '.m-text-container' )[0],
    handler: function( direction ) {
        if (direction === 'down') {
            console.log('waypoint down')
        } else {
            console.log('waypoint up')
        }
    }
})

shared.addSharedEventListeners(false);
contentEffects.createEffectClasses();
setupVideos();

   
window.onload = (event) => {
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
