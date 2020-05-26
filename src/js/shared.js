import { gsap } from 'gsap';
import $ from 'jquery';

export var HEADER_SEL = '.header';
export var TOP_NAV_TOGGLE_SEL = '.topNavToggle button';
export var TOP_NAV_TOGGLE_BAR_SEL = '.topNavToggle .bar';
export var TOP_NAV_TOGGLE_FST_SEL = '.topNavToggle .fst';
export var TOP_NAV_TOGGLE_SCD_SEL = '.topNavToggle .scd';
export var TOP_NAV_TOGGLE_THRD_SEL = '.topNavToggle .thrd';
export var TOP_NAV_TOGGLE_DIV_SEL = '.topNavToggle';

export var BOTTOM_NAV_TOGGLES_SEL = '.bottomNavToggles';
export var BOTTOM_NAV_TOGGLES_CHILD_SEL = '.bottomNavToggles button';
export var BOTTOM_NAV_TOGGLES_COLORED_CHILD_SEL = '.bottomNavToggles button.impressum, .bottomNavToggles button.datenschutz, .bottomNavToggles button.kontakt';
export var OPEN_KONTAKT_TOGGLE_SEL = '.kontakt.open';
export var OPEN_IMPRESSUM_TOGGLE_SEL = '.impressum.open';
export var OPEN_DATENSCHUTZ_TOGGLE_SEL = '.datenschutz.open';

export var CLOSE_BOTTOMNAV_TOGGLE_SEL = 'footer button.schliessen';

export var IMPRINT_TOGGLE_SEL = '.bottomNavToggles .impressum';

export var CLASS_NAV_OPEN = 'nav-open';
export var CLASS_NAV_WHITE = 'nav-white';
export var CLASS_HEADER_OPEN = 'head-open';
export var CLASS_KONTAKT_OPEN = 'kont-open';
export var CLASS_IMPRESSUM_OPEN = 'impressum-open';
export var CLASS_DATENSCHUTZ_OPEN = 'datenschutz-open';

export var SECTION_NAV_SEL = '#fp-nav ul li a span';

// add eventListeners
export function addSharedEventListeners(STARTPAGE) {
    $(TOP_NAV_TOGGLE_SEL)[0].addEventListener('click', () => {
        headerToggle();
    });
    $(TOP_NAV_TOGGLE_SEL)[0].addEventListener('mousedown', () => {
        $(TOP_NAV_TOGGLE_SEL)[0].style.outline = '0';
    });
    $(OPEN_KONTAKT_TOGGLE_SEL)[0].addEventListener('click', () => {
        kontaktToggle();
    });
    $(OPEN_KONTAKT_TOGGLE_SEL)[0].addEventListener('mousedown', () => {
        $(OPEN_KONTAKT_TOGGLE_SEL)[0].style.outline = '0';
    });
    $(OPEN_IMPRESSUM_TOGGLE_SEL)[0].addEventListener('click', () => {
        impressumToggle();
    });
    $(OPEN_IMPRESSUM_TOGGLE_SEL)[0].addEventListener('mousedown', () => {
        $(OPEN_IMPRESSUM_TOGGLE_SEL)[0].style.outline = '0';
    });
    $(OPEN_DATENSCHUTZ_TOGGLE_SEL)[0].addEventListener('click', () => {
        datenschutzToggle();
    });
    $(OPEN_DATENSCHUTZ_TOGGLE_SEL)[0].addEventListener('mousedown', () => {
        $(OPEN_DATENSCHUTZ_TOGGLE_SEL)[0].style.outline = '0';
    });
    $(CLOSE_BOTTOMNAV_TOGGLE_SEL)[0].addEventListener('click', () => {
        schliessenToggle(STARTPAGE);
    });
    $(CLOSE_BOTTOMNAV_TOGGLE_SEL)[0].addEventListener('mousedown', () => {
        $(CLOSE_BOTTOMNAV_TOGGLE_SEL)[0].style.outline = '0';
    });
}

export function headerToggle(SCROLLING, STARTPAGE) {
    animateHeaderToggle();
    navToggle(SCROLLING, STARTPAGE);
    elToggle(CLASS_HEADER_OPEN);
    
}

function schliessenToggle(STARTPAGE) {
    navToggle(false, STARTPAGE);
    if (isOpen(CLASS_KONTAKT_OPEN)) {
        $(document.body).removeClass(CLASS_KONTAKT_OPEN);
    } else if (isOpen(CLASS_IMPRESSUM_OPEN)) {
        $(document.body).removeClass(CLASS_IMPRESSUM_OPEN);
    } else if (isOpen(CLASS_DATENSCHUTZ_OPEN)) {
        $(document.body).removeClass(CLASS_DATENSCHUTZ_OPEN);
    }
}

function kontaktToggle(STARTPAGE) {
    navToggle(false, STARTPAGE);
    elToggle(CLASS_KONTAKT_OPEN);
}

function impressumToggle(STARTPAGE) {
    navToggle(false, STARTPAGE);
    elToggle(CLASS_IMPRESSUM_OPEN);
}

function datenschutzToggle(STARTPAGE) {
    navToggle(false, STARTPAGE);
    elToggle(CLASS_DATENSCHUTZ_OPEN);
}


// animating functions
function animateHeaderToggle() {
    if (!isOpen(CLASS_HEADER_OPEN)) {
        gsap.to(TOP_NAV_TOGGLE_SCD_SEL, {duration: 0.2, scaleX: 0, transformOrigin: "right center"});
        gsap.to(TOP_NAV_TOGGLE_FST_SEL, {duration: 0.4, rotate: '-45', scaleX: 0.85, transformOrigin: "right center"});
        gsap.to(TOP_NAV_TOGGLE_THRD_SEL, {duration: 0.4, rotate: '45', scaleX: 0.85, transformOrigin: "right center"});
    } else {
        gsap.to(TOP_NAV_TOGGLE_SCD_SEL, {duration: 0.4, scaleX: 1, transformOrigin: "right center"});
        gsap.to(TOP_NAV_TOGGLE_FST_SEL, {duration: 0.4, rotate: '0', scaleX: 1, transformOrigin: "right center"});
        gsap.to(TOP_NAV_TOGGLE_THRD_SEL, {duration: 0.4, rotate: '0', scaleX: 1, transformOrigin: "right center"});
    }
}

// helper functions
function navToggle(SCROLLING, STARTPAGE) {
    elToggle(CLASS_NAV_OPEN);
}

export function whiteNavToggle() {
    elToggle(CLASS_NAV_WHITE);
}

function elToggle(CLASS) {
    if (!isOpen(CLASS)) {
        $(document.body).addClass(CLASS);
    } else {
        $(document.body).removeClass(CLASS);
    }
}

export function isOpen(CLASS) {
    return $(document.body).hasClass(CLASS);
}

export function footerIsOpen() {
    return isOpen(CLASS_KONTAKT_OPEN) || isOpen(CLASS_IMPRESSUM_OPEN) || isOpen(CLASS_DATENSCHUTZ_OPEN);
}