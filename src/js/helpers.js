import $ from 'jquery';

let headerCount = {};
let footerCount = {};

export function addFooterClass( className ) {
    if ( $( '.bottomNavToggles' ).hasClass( className ) ) {
        if ( footerCount[className] === undefined ) {
            footerCount[className] = 0;
        }
        footerCount[className]++;
    } else {
        $( '.bottomNavToggles' ).addClass( className );
    }
}

export function addHeaderClass( className ) {
    if ( $( '.navBar' ).hasClass( className ) ) {
        if ( headerCount[className] === undefined ) {
            headerCount[className] = 0;
        }
        headerCount[className]++;
    } else {
        $( '.navBar' ).addClass( className );
        
    }
}

export function removeFooterClass( className ) {
    if ( footerCount[className] > 0 && className in footerCount ) {
        footerCount[className]--;
    } else {
        $( '.bottomNavToggles' ).removeClass( className );
    }
}

export function resetFooterClass( className ) {
    footerCount[className] = 0;
    $( '.bottomNavToggles' ).removeClass( className );
}

export function removeHeaderClass( className ) {
    if ( headerCount[className] > 0 && className in headerCount ) {
        headerCount[className]--;
    } else {
        $( '.navBar' ).removeClass( className );
    }
}

export function resetHeaderClass( className ) {
    headerCount[className] = 0;
    $( '.navBar' ).removeClass( className );
}