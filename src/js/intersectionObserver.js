import 'intersection-observer';
import $ from 'jquery';
import * as helpers from './helpers.js';

export function createObserver( elements, handleIntersect, rootMargin ) {

    let observer;
  
    let options = {
      root: null,
      rootMargin: rootMargin,
      threshold: buildThresholdList(1)
    };

    console.log(rootMargin);
  
    observer = new IntersectionObserver(handleIntersect, options);

    observer[ 'handleIntersectCallsSinceObserverReset' ] = 0;
    observer[ 'observedElements' ] = 0;

    $( elements ).each( function( index, element ) {
        observer.observe( element );
        observer[ 'observedElements' ]++;
    })

    return observer;
}

export function resetObserver( elements, handleIntersect, rootMargin ) {
    return createObserver(  elements, handleIntersect, rootMargin );
}

  function buildThresholdList(numSteps) {
    
    //let thresholds = [0, 0.0001, 0.001, 0.01, 0.1, 0.2, 0.4, 0.6, 0.8, 0.9, 0.09, 0.009, 0.0009, 1];
    let thresholds = [];
    for (let i=1.0; i<=numSteps; i++) {
      let ratio = i/numSteps;
      thresholds.push(ratio);
    }
  
    thresholds.push(0);
    return thresholds;
}

function handleFooterIntersect( entries, observer ) {
  entries.forEach( ( entry ) => {
    observer[ 'handleIntersectCallsSinceObserverReset' ]++;
      if ( entry.isIntersecting ) {
          helpers.addFooterClass( entry.target.className.match( /(\w+\-)+footer/g ).toString().replace('-footer', '-f') )
      } else if ( observer[ 'handleIntersectCallsSinceObserverReset' ] > observer[ 'observedElements' ] ) {
          helpers.removeFooterClass( entry.target.className.match( /(\w+\-)+footer/g ).toString().replace('-footer', '-f') )
    }
  });
}

function handleRightHeaderIntersect( entries, observer ) {
  entries.forEach( ( entry ) => {
    observer[ 'handleIntersectCallsSinceObserverReset' ]++;
      if ( entry.isIntersecting ) {
          helpers.addHeaderClass( entry.target.className.match( /(\w+\-)+header/g ).toString().replace('-header', '-hr') )
      } else if ( observer[ 'handleIntersectCallsSinceObserverReset' ] > observer[ 'observedElements' ] ) {
          helpers.removeHeaderClass( entry.target.className.match( /(\w+\-)+header/g ).toString().replace('-header', '-hr') )
    }
  });
}

function handleLeftHeaderIntersect( entries, observer ) {
  entries.forEach( ( entry ) => {
    observer[ 'handleIntersectCallsSinceObserverReset' ]++;
      if ( entry.isIntersecting ) {
          helpers.addHeaderClass( entry.target.className.match( /(\w+\-)+header/g ).toString().replace('-header', '-hl') )
      } else if ( observer[ 'handleIntersectCallsSinceObserverReset' ] > observer[ 'observedElements' ] ) {
          helpers.removeHeaderClass( entry.target.className.match( /(\w+\-)+header/g ).toString().replace('-header', '-hl') )
    }
  });
}

export function createFooterObserver() {
  const measurements = footerMeasurements();
  return createObserver(
      $( '.white-footer, .black-footer, .white-bg-footer' ),
      handleFooterIntersect,
      '-' + measurements.observerTopMargin + 'px 0px 0px -' + measurements.halfWindowWidth + 'px'
  );
}

export function createRightHeaderObserver() {
  const measurements = headerMeasurements();
  return createObserver(
      $( '.white-header, .black-header, .white-bg-header' ),
      handleRightHeaderIntersect,
      '0px 0px -' + measurements.observerBottomMargin + 'px -' + measurements.halfWindowWidth + 'px'
  );
}

export function createLeftHeaderObserver() {
  const measurements = headerMeasurements();
  return createObserver(
      $( '.white-header, .black-header, .white-bg-header' ),
      handleLeftHeaderIntersect,
      '0px -' + measurements.halfWindowWidth + 'px -' + measurements.observerBottomMargin + 'px 0px'
  );
}

function footerMeasurements() {
  const windowHeight = window.outerHeight === 0 ? window.innerHeight : Math.min( window.outerHeight, window.innerHeight );
  const windowWidth = $( window ).width();
  const footerHeight = $( '.bottomNavToggles' ).outerHeight(true);
  return {
      halfWindowWidth: Math.floor(windowWidth) / 2 + 1,
      observerTopMargin: windowHeight - footerHeight
  }
}

function headerMeasurements() {
  const windowHeight = window.outerHeight === 0 ? window.innerHeight : Math.min( window.outerHeight, window.innerHeight );
  const windowWidth = $( window ).width();
  const headerHeight = $( '.navBar' ).outerHeight(true);
  return {
      halfWindowWidth: Math.floor(windowWidth) / 2 + 1,
      observerBottomMargin: windowHeight - headerHeight
  }
}

export function updateFooterObserver() {
  const measurements = footerMeasurements();
  helpers.resetFooterClass( 'black-f' );
  helpers.resetFooterClass( 'white-f' );
  helpers.resetFooterClass( 'white-bg-f' );
  return resetObserver(
      $( '.white-footer, .black-footer, .white-bg-footer' ),
      handleFooterIntersect,
      '-' + measurements.observerTopMargin + 'px 0px 0px -' + measurements.halfWindowWidth + 'px'
  );
}

export function updateRightHeaderObserver() {
  const measurements = headerMeasurements();
  helpers.resetHeaderClass( 'black-hr' );
  helpers.resetHeaderClass( 'white-hr' );
  helpers.resetHeaderClass( 'white-bg-hr' );
  return resetObserver(
      $( '.white-header, .black-header, .white-bg-header' ),
      handleRightHeaderIntersect,
      '0px 0px -' + measurements.observerBottomMargin + 'px -' + measurements.halfWindowWidth + 'px'
  );

}

export function updateLeftHeaderObserver() {
  const measurements = headerMeasurements();
  helpers.resetHeaderClass( 'black-hl' );
  helpers.resetHeaderClass( 'white-hl' );
  helpers.resetHeaderClass( 'white-bg-hl' );
  return resetObserver(
      $( '.white-header, .black-header, .white-bg-header' ),
      handleLeftHeaderIntersect,
      '0px -' + measurements.halfWindowWidth + 'px -' + measurements.observerBottomMargin + 'px 0px'
  );

}