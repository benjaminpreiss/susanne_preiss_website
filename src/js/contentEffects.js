import $ from 'jquery';
import videojs from 'video.js';

export function createEffectClasses () {
    $( '.m-link' ).on( 'mouseenter', mouseEnterAddClass );
    $( '.m-link' ).on( 'mouseleave', mouseLeaveRemoveClass );
    $( '.m-play-button' ).on( 'mouseenter', mouseEnterAddClass );
    $( '.m-play-button' ).on( 'mouseleave', mouseLeaveRemoveClass );
    $( '.m-play-button' ).on( 'click', startVideo );
}

function mouseEnterAddClass() {
    $( this ).parents( '.effect-container' ).addClass( 'mouse-enter' );
}

function mouseLeaveRemoveClass() {
    $( this ).parents( '.effect-container' ).removeClass( 'mouse-enter' );
}

function startVideo() {
    const effectContainer = $( this ).parents( '.effect-container' );
    const video = effectContainer.find( '.video-js' );
    effectContainer.addClass( 'video-start' );
    setTimeout(
        () => {
            videojs.getPlayer( video[0] ).ready( function() {
                this.play().then(
                    () => {
                        this.controls(true);
                    }
                )
                this.on('ended', () => {
                    endVideo( this, effectContainer );
                })
            } )
        },
        200
    );
}

function endVideo( player, effectContainer ) {
    player.hasStarted(false);
    player.bigPlayButton.dispose();
    
    effectContainer.removeClass( 'video-start' );
}