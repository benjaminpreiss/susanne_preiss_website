import { gsap } from 'gsap';
import fullpage from 'fullpage.js';
import $ from 'jquery';
import * as shared from './shared.js';
import passwords from '../json/passwords.json';

new fullpage('#fullpage', {
    //callbacks
    onLeave: function(origin, destination, direction) {
        // enter first page: make all UI-elements disappear
        if (destination.index == 0 && !shared.footerIsOpen()) {
            // topNavToggle
            $(shared.TOP_NAV_TOGGLE_DIV_SEL)[0].style.opacity = '0';
            $(shared.TOP_NAV_TOGGLE_DIV_SEL)[0].style.display = 'none';
            // bottomNavToggles
            $(shared.BOTTOM_NAV_TOGGLES_SEL)[0].style.opacity = '0';
            $(shared.BOTTOM_NAV_TOGGLES_SEL)[0].style.display = 'none';
        }
        // make open header disappear on scroll
        if (shared.isOpen(shared.CLASS_HEADER_OPEN)) {
            shared.headerToggle(true, true);
        }
        // change UI elements color on slide sparring arrive
        if (destination.index == 4 && !shared.footerIsOpen()) {
            shared.whiteNavToggle();
        }
        // change UI elements color on slide sparring leave
        if (origin.index == 4 && !shared.footerIsOpen()) {
            shared.whiteNavToggle();
        }
        // disable fullpage scrolling when either kontakt, impressum or datenschutz is open
        if (shared.footerIsOpen()) {
			return false;
        }
    },
    afterLoad: function(origin, destination, direction) {
        // make topNavToggle and kontakt appear
        if (destination.index != 0) {
            // topNavToggle
            $(shared.TOP_NAV_TOGGLE_DIV_SEL)[0].style.display = 'block';
            gsap.to(shared.TOP_NAV_TOGGLE_DIV_SEL, {duration: 0.4, opacity: '1'});
            // kontakt
            $(shared.BOTTOM_NAV_TOGGLES_SEL)[0].style.display = 'flex';
            gsap.to(shared.BOTTOM_NAV_TOGGLES_SEL, {duration: 0.4, opacity: '1'});

        }
    },
    // license
    licenseKey: passwords.fullpage_key,
    //options
    //anchors:['start', 'workshops', 'personal', 'business', 'management', 'speaker'],
    autoScrolling:true,
    scrollBar:false,
    css3:true,
    navigation:true,
    slidesNavigation:true,
    controlArrows:false,
    recordHistory:false,
    verticalCentered:false,
    //offsetSectionsKey: 'B535F9D6-B0BE4324-82649228-DE5547BB',
    //offsetSections:true,
});

//methods
fullpage_api.setAllowScrolling(true);

// add eventListeners
shared.addSharedEventListeners(true);