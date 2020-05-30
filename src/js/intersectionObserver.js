import $ from 'jquery';

export function createObserver( elements, handleIntersect, rootMargin ) {

    let observer;
  
    let options = {
      root: null,
      rootMargin: rootMargin,
      threshold: buildThresholdList(100)
    };
  
    observer = new IntersectionObserver(handleIntersect, options);

    $( elements ).each( function( index, element ) {
        observer.observe( element );
    })

    return observer;
}

export function resetObserver( elements, handleIntersect, rootMargin ) {
    return createObserver(  elements, handleIntersect, rootMargin );
}

  function buildThresholdList(numSteps) {
    let thresholds = [0, 0.001, 0.01, 0.1, 0.2, 0.4, 0.6, 0.8, 0.9, 0.09, 0.009, 1];
    /*
    for (let i=1.0; i<=numSteps; i++) {
      let ratio = i/numSteps;
      thresholds.push(ratio);
    }
  
    thresholds.push(0);
    */
    return thresholds;
}