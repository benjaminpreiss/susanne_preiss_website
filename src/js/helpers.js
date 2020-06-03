import $ from 'jquery';

let headerCount = 0;
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
        if ( headerCount === 0 ) {
            headerCount++;
            console.log(headerCount);
        }
    } else {
        console.log(className)
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
    if ( headerCount > 0 ) {
        headerCount--;
    } else {
        $( '.navBar' ).removeClass( className );
    }
}