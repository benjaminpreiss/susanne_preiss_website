import * as shared from './shared.js';
import * as contentEffects from './contentEffects.js';
import videojs from 'video.js';
import $ from 'jquery';
import * as observer from './intersectionObserver.js';

let footerObserver;
let headerRightObserver;
let headerLeftObserver;

shared.addSharedEventListeners(false);
$( window ).on( 'load', function() {
    footerObserver = createFooterObserver();
    headerRightObserver = createRightHeaderObserver();
    headerLeftObserver = createLeftHeaderObserver();
    setupVideos();
    contentEffects.createEffectClasses();
})
$( window ).on( 'resize', function() {
    footerObserver.disconnect();
    headerRightObserver.disconnect();
    headerLeftObserver.disconnect();
    footerObserver = updateFooterObserver();
    headerRightObserver = updateRightHeaderObserver();
    headerLeftObserver = updateLeftHeaderObserver();
})

function setupVideos() {
    $( '.video-js' ).each( function( index, element ) {
        videojs( element, {
            controls: false,
            preload: 'auto'
        } );
    })
}

function handleFooterIntersect( entries, observer ) {
    entries.forEach( ( entry ) => {
        if ( entry.isIntersecting ) {
            addFooterClass( entry.target.className.match( /(\w+\-)+footer/g ).toString().replace('-footer', '-f') )
        } else {
            removeFooterClass( entry.target.className.match( /(\w+\-)+footer/g ).toString().replace('-footer', '-f') )
      }
    });
}

function handleRightHeaderIntersect( entries, observer ) {
    entries.forEach( ( entry ) => {
        if ( entry.isIntersecting ) {
            addHeaderClass( entry.target.className.match( /(\w+\-)+header/g ).toString().replace('-header', '-hr') )
        } else {
            removeHeaderClass( entry.target.className.match( /(\w+\-)+header/g ).toString().replace('-header', '-hr') )
      }
    });
}

function handleLeftHeaderIntersect( entries, observer ) {
    entries.forEach( ( entry ) => {
        if ( entry.isIntersecting ) {
            addHeaderClass( entry.target.className.match( /(\w+\-)+header/g ).toString().replace('-header', '-hl') )
        } else {
            removeHeaderClass( entry.target.className.match( /(\w+\-)+header/g ).toString().replace('-header', '-hl') )
      }
    });
}

function createFooterObserver() {
    const measurements = footerMeasurements();
    return observer.createObserver(
        $( '.white-footer, .black-footer, .white-bg-footer' ),
        handleFooterIntersect,
        '-' + measurements.observerTopMargin + 'px 0px 0px -' + measurements.halfWindowWidth + 'px'
    );
}

function createRightHeaderObserver() {
    const measurements = headerMeasurements();
    return observer.createObserver(
        $( '.white-header, .black-header, .white-bg-header' ),
        handleRightHeaderIntersect,
        '0px 0px -' + measurements.observerBottomMargin + 'px -' + measurements.halfWindowWidth + 'px'
    );
}

function createLeftHeaderObserver() {
    const measurements = headerMeasurements();
    return observer.createObserver(
        $( '.white-header, .black-header, .white-bg-header' ),
        handleLeftHeaderIntersect,
        '0px -' + measurements.halfWindowWidth + 'px -' + measurements.observerBottomMargin + 'px 0px'
    );
}

function footerMeasurements() {
    const windowHeight = $( window ).height();
    const windowWidth = $( window ).width();
    const footerHeight = $( '.bottomNavToggles' ).outerHeight(true);
    return {
        halfWindowWidth: Math.floor(windowWidth) / 2 + 1,
        observerTopMargin: windowHeight - footerHeight
    }
}

function headerMeasurements() {
    const windowHeight = $( window ).height();
    const windowWidth = $( window ).width();
    const headerHeight = $( '.navBar' ).outerHeight(true);
    return {
        halfWindowWidth: Math.floor(windowWidth) / 2 + 1,
        observerBottomMargin: windowHeight - headerHeight
    }
}

function updateFooterObserver() {
    const measurements = footerMeasurements();
    return observer.resetObserver(
        $( '.white-footer, .black-footer, .white-bg-footer' ),
        handleFooterIntersect,
        '-' + measurements.observerTopMargin + 'px 0px 0px -' + measurements.halfWindowWidth + 'px'
    );
}

function updateRightHeaderObserver() {
    const measurements = headerMeasurements();
    return observer.resetObserver(
        $( '.white-header, .black-header, .white-bg-header' ),
        handleRightHeaderIntersect,
        '0px 0px -' + measurements.observerBottomMargin + 'px -' + measurements.halfWindowWidth + 'px'
    );

}

function updateLeftHeaderObserver() {
    const measurements = headerMeasurements();
    return observer.resetObserver(
        $( '.white-header, .black-header, .white-bg-header' ),
        handleLeftHeaderIntersect,
        '0px -' + measurements.halfWindowWidth + 'px -' + measurements.observerBottomMargin + 'px 0px'
    );

}

function addFooterClass( className ) {
    if (!$( '.bottomNavToggles').hasClass( className ) ) {
        $( '.bottomNavToggles').addClass( className );
    }
}

function addHeaderClass( className ) {
    if (!$( '.navBar').hasClass( className ) ) {
        $( '.navBar').addClass( className );
    }
}

function removeFooterClass( className ) {
    $( '.bottomNavToggles').removeClass( className );
}

function removeHeaderClass( className ) {
    $( '.navBar').removeClass( className );
}