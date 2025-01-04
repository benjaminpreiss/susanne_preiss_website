import * as helpers from './helpers';

export class ExtendedIntersectionObserver extends IntersectionObserver {
	handleIntersectCallsSinceObserverReset = 0;
	observedElements = 0;
	constructor(callback: ExtendedIntersectionObserverCallback, options?: IntersectionObserverInit) {
		super(callback as IntersectionObserverCallback, options);
		this.handleIntersectCallsSinceObserverReset = 0;
		this.observedElements = 0;
	}
}

type ExtendedIntersectionObserverCallback = (
	entries: IntersectionObserverEntry[],
	observer: ExtendedIntersectionObserver
) => void;

export function createObserver(
	elements: NodeListOf<Element>,
	handleIntersect: ExtendedIntersectionObserverCallback,
	rootMargin: IntersectionObserverInit['rootMargin']
) {
	const options = {
		root: null,
		rootMargin: rootMargin,
		threshold: buildThresholdList(1)
	};

	const observer = new ExtendedIntersectionObserver(handleIntersect, options);

	observer['handleIntersectCallsSinceObserverReset'] = 0;
	observer['observedElements'] = 0;

	elements.forEach(function (element) {
		observer.observe(element);
		observer['observedElements']++;
	});

	return observer;
}

const resetObserver = createObserver;

function buildThresholdList(numSteps: number) {
	//let thresholds = [0, 0.0001, 0.001, 0.01, 0.1, 0.2, 0.4, 0.6, 0.8, 0.9, 0.09, 0.009, 0.0009, 1];
	const thresholds: number[] = [];
	for (let i = 1.0; i <= numSteps; i++) {
		const ratio = i / numSteps;
		thresholds.push(ratio);
	}

	thresholds.push(0);
	return thresholds;
}

const handleFooterIntersect: ExtendedIntersectionObserverCallback = function (entries, observer) {
	entries.forEach((entry) => {
		observer['handleIntersectCallsSinceObserverReset']++;
		if (entry.isIntersecting) {
			const classNameMatch = entry.target.className.match(/(\w+-)+footer/g);
			if (classNameMatch)
				helpers.addFooterClass(classNameMatch.toString().replace('-footer', '-f'));
		} else if (observer['handleIntersectCallsSinceObserverReset'] > observer['observedElements']) {
			const classNameMatch = entry.target.className.match(/(\w+-)+footer/g);
			if (classNameMatch)
				helpers.removeFooterClass(classNameMatch.toString().replace('-footer', '-f'));
		}
	});
};

const handleRightHeaderIntersect: ExtendedIntersectionObserverCallback = function (
	entries,
	observer
) {
	entries.forEach((entry) => {
		observer['handleIntersectCallsSinceObserverReset']++;
		if (entry.isIntersecting) {
			const classNameMatch = entry.target.className.match(/(\w+-)+header/g);
			if (classNameMatch)
				helpers.addHeaderClass(classNameMatch.toString().replace('-header', '-hr'));
		} else if (observer['handleIntersectCallsSinceObserverReset'] > observer['observedElements']) {
			const classNameMatch = entry.target.className.match(/(\w+-)+header/g);
			if (classNameMatch)
				helpers.removeHeaderClass(classNameMatch.toString().replace('-header', '-hr'));
		}
	});
};

const handleLeftHeaderIntersect: ExtendedIntersectionObserverCallback = function (
	entries,
	observer
) {
	entries.forEach((entry) => {
		observer['handleIntersectCallsSinceObserverReset']++;
		if (entry.isIntersecting) {
			const classNameMatch = entry.target.className.match(/(\w+-)+header/g);
			if (classNameMatch)
				helpers.addHeaderClass(classNameMatch.toString().replace('-header', '-hl'));
		} else if (observer['handleIntersectCallsSinceObserverReset'] > observer['observedElements']) {
			const classNameMatch = entry.target.className.match(/(\w+-)+header/g);
			if (classNameMatch)
				helpers.removeHeaderClass(classNameMatch.toString().replace('-header', '-hl'));
		}
	});
};

export function createFooterObserver() {
	const measurements = footerMeasurements();
	return createObserver(
		document.querySelectorAll('.white-footer, .black-footer, .white-bg-footer'),
		handleFooterIntersect,
		'-' + measurements.observerTopMargin + 'px 0px 0px -' + measurements.halfWindowWidth + 'px'
	);
}

export function createRightHeaderObserver() {
	const measurements = headerMeasurements();
	return createObserver(
		document.querySelectorAll('.white-header, .black-header, .white-bg-header'),
		handleRightHeaderIntersect,
		'0px 0px -' + measurements.observerBottomMargin + 'px -' + measurements.halfWindowWidth + 'px'
	);
}

export function createLeftHeaderObserver() {
	const measurements = headerMeasurements();
	return createObserver(
		document.querySelectorAll('.white-header, .black-header, .white-bg-header'),
		handleLeftHeaderIntersect,
		'0px -' + measurements.halfWindowWidth + 'px -' + measurements.observerBottomMargin + 'px 0px'
	);
}

function footerMeasurements() {
	const windowHeight =
		window.outerHeight === 0
			? window.innerHeight
			: Math.min(window.outerHeight, window.innerHeight);
	const windowWidth = document.documentElement.clientWidth;
	const footerHeight =
		document.querySelector('.bottomNavToggles')?.getBoundingClientRect().height ?? 0;
	return {
		halfWindowWidth: Math.floor(windowWidth) / 2 + 1,
		observerTopMargin: windowHeight - footerHeight
	};
}

function headerMeasurements() {
	const windowHeight =
		window.outerHeight === 0
			? window.innerHeight
			: Math.min(window.outerHeight, window.innerHeight);
	const windowWidth = document.documentElement.clientWidth;
	const headerHeight = document.querySelector('.navBar')?.getBoundingClientRect().height ?? 0;
	return {
		halfWindowWidth: Math.floor(windowWidth) / 2 + 1,
		observerBottomMargin: windowHeight - headerHeight
	};
}

export function updateFooterObserver() {
	const measurements = footerMeasurements();
	helpers.resetFooterClass('black-f');
	helpers.resetFooterClass('white-f');
	helpers.resetFooterClass('white-bg-f');
	return resetObserver(
		document.querySelectorAll('.white-footer, .black-footer, .white-bg-footer'),
		handleFooterIntersect,
		'-' + measurements.observerTopMargin + 'px 0px 0px -' + measurements.halfWindowWidth + 'px'
	);
}

export function updateRightHeaderObserver() {
	const measurements = headerMeasurements();
	helpers.resetHeaderClass('black-hr');
	helpers.resetHeaderClass('white-hr');
	helpers.resetHeaderClass('white-bg-hr');
	return resetObserver(
		document.querySelectorAll('.white-header, .black-header, .white-bg-header'),
		handleRightHeaderIntersect,
		'0px 0px -' + measurements.observerBottomMargin + 'px -' + measurements.halfWindowWidth + 'px'
	);
}

export function updateLeftHeaderObserver() {
	const measurements = headerMeasurements();
	helpers.resetHeaderClass('black-hl');
	helpers.resetHeaderClass('white-hl');
	helpers.resetHeaderClass('white-bg-hl');
	return resetObserver(
		document.querySelectorAll('.white-header, .black-header, .white-bg-header'),
		handleLeftHeaderIntersect,
		'0px -' + measurements.halfWindowWidth + 'px -' + measurements.observerBottomMargin + 'px 0px'
	);
}
