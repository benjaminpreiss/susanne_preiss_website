declare module 'fullpage.js' {
	interface FullPageOptions {
		// Basic options
		menu?: string; // Selector for menu
		anchors?: string[]; // Anchor links
		lockAnchors?: boolean;
		navigation?: boolean;
		navigationPosition?: 'left' | 'right';
		navigationTooltips?: string[];
		showActiveTooltip?: boolean;
		slidesNavigation?: boolean;
		slidesNavPosition?: 'top' | 'bottom';

		// Scrolling
		css3?: boolean;
		scrollingSpeed?: number;
		autoScrolling?: boolean;
		fitToSection?: boolean;
		fitToSectionDelay?: number;
		scrollBar?: boolean;
		easing?: string;
		easingcss3?: string;
		loopBottom?: boolean;
		loopTop?: boolean;
		loopHorizontal?: boolean;
		continuousVertical?: boolean;
		normalScrollElements?: string;
		scrollOverflow?: boolean;
		touchSensitivity?: number;
		normalScrollElementTouchThreshold?: number;

		// Accessibility
		keyboardScrolling?: boolean;
		animateAnchor?: boolean;
		recordHistory?: boolean;

		// Design
		controlArrows?: boolean;
		verticalCentered?: boolean;
		sectionsColor?: string[];
		paddingTop?: string;
		paddingBottom?: string;
		fixedElements?: string;
		responsiveWidth?: number;
		responsiveHeight?: number;
		responsiveSlides?: boolean;

		// Custom selectors
		sectionSelector?: string;
		slideSelector?: string;

		// Events
		onLeave?(origin: Section, destination: Section, direction: string): void;
		afterLoad?(origin: Section, destination: Section, direction: string): void;
		afterRender?(): void;
		afterResize?(width: number, height: number): void;
		afterSlideLoad?(section: Section, origin: Slide, destination: Slide, direction: string): void;
		onSlideLeave?(section: Section, origin: Slide, destination: Slide, direction: string): void;

		// Key
		licenseKey?: string;
	}

	interface Section {
		anchor: string;
		index: number;
	}

	interface Slide {
		anchor: string;
		index: number;
	}

	class FullPage {
		constructor(wrapper: string | HTMLElement, options?: FullPageOptions);

		// Public API
		moveSectionUp(): void;
		moveSectionDown(): void;
		moveTo(section: number | string, slide?: number): void;
		silentMoveTo(section: number | string, slide?: number): void;
		moveSlideRight(): void;
		moveSlideLeft(): void;

		// State Management
		setAutoScrolling(value: boolean): void;
		setFitToSection(value: boolean): void;
		setLockAnchors(value: boolean): void;
		setRecordHistory(value: boolean): void;
		setScrollingSpeed(value: number): void;
		setAllowScrolling(value: boolean, directions?: string): void;
		setKeyboardScrolling(value: boolean, directions?: string): void;

		// Utilities
		destroy(type?: 'all' | 'reset'): void;
		reBuild(): void;
		update(): void;
	}

	const fullpage: {
		new (wrapper: string | HTMLElement, options?: FullPageOptions): FullPage;
	};

	export = fullpage;
}
