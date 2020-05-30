import videojs from 'video.js';
import $ from 'jquery';

export default function setupVideos() {
    $( '.video-js' ).each( function( index, element ) {
        videojs( element, {
            controls: false,
            preload: 'auto'
        } );
    })
}