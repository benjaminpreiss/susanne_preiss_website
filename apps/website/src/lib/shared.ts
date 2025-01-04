import { gsap } from 'gsap';

export const HEADER_SEL = '.header';
export const TOP_NAV_TOGGLE_SEL = '.topNavToggle button';
export const TOP_NAV_TOGGLE_BAR_SEL = '.topNavToggle .bar';
export const TOP_NAV_TOGGLE_FST_SEL = '.topNavToggle .fst';
export const TOP_NAV_TOGGLE_SCD_SEL = '.topNavToggle .scd';
export const TOP_NAV_TOGGLE_THRD_SEL = '.topNavToggle .thrd';
export const TOP_NAV_TOGGLE_DIV_SEL = '.topNavToggle';

export const BOTTOM_NAV_TOGGLES_SEL = '.bottomNavToggles';
export const BOTTOM_NAV_TOGGLES_CHILD_SEL = '.bottomNavToggles button';
export const BOTTOM_NAV_TOGGLES_COLORED_CHILD_SEL =
	'.bottomNavToggles button.impressum, .bottomNavToggles button.datenschutz, .bottomNavToggles button.kontakt';
export const OPEN_KONTAKT_TOGGLE_SEL = '.kontakt.open';
export const OPEN_IMPRESSUM_TOGGLE_SEL = '.impressum.open';
export const OPEN_DATENSCHUTZ_TOGGLE_SEL = '.datenschutz.open';

export const CLOSE_BOTTOMNAV_TOGGLE_SEL = 'footer button.schliessen';

export const IMPRINT_TOGGLE_SEL = '.bottomNavToggles .impressum';

export const CLASS_NAV_OPEN = 'nav-open';
export const CLASS_NAV_WHITE = 'nav-white';
export const CLASS_HEADER_OPEN = 'head-open';
export const CLASS_KONTAKT_OPEN = 'kont-open';
export const CLASS_IMPRESSUM_OPEN = 'impressum-open';
export const CLASS_DATENSCHUTZ_OPEN = 'datenschutz-open';

export const SECTION_NAV_SEL = '#fp-nav ul li a span';

// add eventListeners
export function addSharedEventListeners() {
	document.querySelector(TOP_NAV_TOGGLE_SEL)?.addEventListener('click', () => {
		headerToggle();
	});
	document.querySelector(TOP_NAV_TOGGLE_SEL)?.addEventListener('mousedown', () => {
		document
			.querySelectorAll<HTMLElement>(TOP_NAV_TOGGLE_SEL)
			.forEach((el) => (el.style.outline = '0'));
	});
	document.querySelector(OPEN_KONTAKT_TOGGLE_SEL)?.addEventListener('click', () => {
		kontaktToggle();
	});
	document.querySelector(OPEN_KONTAKT_TOGGLE_SEL)?.addEventListener('mousedown', () => {
		document
			.querySelectorAll<HTMLElement>(OPEN_KONTAKT_TOGGLE_SEL)
			.forEach((el) => (el.style.outline = '0'));
	});
	document.querySelector(OPEN_IMPRESSUM_TOGGLE_SEL)?.addEventListener('click', () => {
		impressumToggle();
	});
	document.querySelector(OPEN_IMPRESSUM_TOGGLE_SEL)?.addEventListener('mousedown', () => {
		document
			.querySelectorAll<HTMLElement>(OPEN_IMPRESSUM_TOGGLE_SEL)
			.forEach((el) => (el.style.outline = '0'));
	});
	document.querySelector(OPEN_DATENSCHUTZ_TOGGLE_SEL)?.addEventListener('click', () => {
		datenschutzToggle();
	});
	document.querySelector(OPEN_DATENSCHUTZ_TOGGLE_SEL)?.addEventListener('mousedown', () => {
		document
			.querySelectorAll<HTMLElement>(OPEN_DATENSCHUTZ_TOGGLE_SEL)
			.forEach((el) => (el.style.outline = '0'));
	});
	document.querySelector(CLOSE_BOTTOMNAV_TOGGLE_SEL)?.addEventListener('click', () => {
		schliessenToggle();
	});
	document.querySelector(CLOSE_BOTTOMNAV_TOGGLE_SEL)?.addEventListener('mousedown', () => {
		document
			.querySelectorAll<HTMLElement>(CLOSE_BOTTOMNAV_TOGGLE_SEL)
			.forEach((el) => (el.style.outline = '0'));
	});
}

export function headerToggle() {
	animateHeaderToggle();
	navToggle();
	elToggle(CLASS_HEADER_OPEN);
}

function schliessenToggle() {
	navToggle();
	if (isOpen(CLASS_KONTAKT_OPEN)) {
		document.body.classList.remove(CLASS_KONTAKT_OPEN);
	} else if (isOpen(CLASS_IMPRESSUM_OPEN)) {
		document.body.classList.remove(CLASS_IMPRESSUM_OPEN);
	} else if (isOpen(CLASS_DATENSCHUTZ_OPEN)) {
		document.body.classList.remove(CLASS_DATENSCHUTZ_OPEN);
	}
}

function kontaktToggle() {
	navToggle();
	elToggle(CLASS_KONTAKT_OPEN);
}

function impressumToggle() {
	navToggle();
	elToggle(CLASS_IMPRESSUM_OPEN);
}

function datenschutzToggle() {
	navToggle();
	elToggle(CLASS_DATENSCHUTZ_OPEN);
}

// animating functions
function animateHeaderToggle() {
	if (!isOpen(CLASS_HEADER_OPEN)) {
		gsap.to(TOP_NAV_TOGGLE_SCD_SEL, { duration: 0.2, scaleX: 0, transformOrigin: 'right center' });
		gsap.to(TOP_NAV_TOGGLE_FST_SEL, {
			duration: 0.4,
			rotate: '-45',
			scaleX: 0.85,
			transformOrigin: 'right center'
		});
		gsap.to(TOP_NAV_TOGGLE_THRD_SEL, {
			duration: 0.4,
			rotate: '45',
			scaleX: 0.85,
			transformOrigin: 'right center'
		});
	} else {
		gsap.to(TOP_NAV_TOGGLE_SCD_SEL, { duration: 0.4, scaleX: 1, transformOrigin: 'right center' });
		gsap.to(TOP_NAV_TOGGLE_FST_SEL, {
			duration: 0.4,
			rotate: '0',
			scaleX: 1,
			transformOrigin: 'right center'
		});
		gsap.to(TOP_NAV_TOGGLE_THRD_SEL, {
			duration: 0.4,
			rotate: '0',
			scaleX: 1,
			transformOrigin: 'right center'
		});
	}
}

// helper functions
function navToggle() {
	elToggle(CLASS_NAV_OPEN);
}

export function whiteNavToggle() {
	elToggle(CLASS_NAV_WHITE);
}

function elToggle(CLASS: string) {
	if (!isOpen(CLASS)) {
		document.body.classList.add(CLASS);
	} else {
		document.body.classList.remove(CLASS);
	}
}

export function isOpen(CLASS: string) {
	return document.body.classList.contains(CLASS);
}

export function footerIsOpen() {
	return (
		isOpen(CLASS_KONTAKT_OPEN) || isOpen(CLASS_IMPRESSUM_OPEN) || isOpen(CLASS_DATENSCHUTZ_OPEN)
	);
}
