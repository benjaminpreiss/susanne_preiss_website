import * as observer from './intersectionObserver.js';
import { addSharedEventListeners } from './shared';

let footerObserver: observer.ExtendedIntersectionObserver;
let headerRightObserver: observer.ExtendedIntersectionObserver;
let headerLeftObserver: observer.ExtendedIntersectionObserver;

addSharedEventListeners();

window.onload = () => {
	footerObserver = observer.createFooterObserver();
	headerRightObserver = observer.createRightHeaderObserver();
	headerLeftObserver = observer.createLeftHeaderObserver();
};
window.onresize = () => {
	if (footerObserver) {
		footerObserver.disconnect();
	}
	if (headerLeftObserver) {
		headerLeftObserver.disconnect();
	}
	if (headerRightObserver) {
		headerRightObserver.disconnect();
	}
	footerObserver = observer.updateFooterObserver();
	headerRightObserver = observer.updateRightHeaderObserver();
	headerLeftObserver = observer.updateLeftHeaderObserver();
};
