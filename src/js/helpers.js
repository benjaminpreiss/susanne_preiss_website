import $ from 'jquery';

let headerCount = {};
let footerCount = 0;

export function addFooterClass( className ) {
    if ( $( '.bottomNavToggles' ).hasClass( className ) ) {
        if (footerCount === 0) {
            footerCount++;
        }
    } else {
        $( '.bottomNavToggles' ).addClass( className );
    }
}

export function addHeaderClass( className ) {
    if ( $( '.navBar' ).hasClass( className ) ) {
        if ( headerCount[className] === undefined ) {
            headerCount[className] = 0;
        }
        if ( headerCount[className] === 0 ) {
            headerCount[className]++;
        }
    } else {
        $( '.navBar' ).addClass( className );
        
    }
}

export function removeFooterClass( className ) {
    if ( footerCount > 0 ) {
        footerCount--;
    } else {
        $( '.bottomNavToggles' ).removeClass( className );
    }
}

export function removeHeaderClass( className ) {
    if ( headerCount[className] > 0 && className in headerCount ) {
        headerCount[className]--;
    } else {
        $( '.navBar' ).removeClass( className );
    }
}