const headerCount: Record<string, number> = {};
const footerCount: Record<string, number> = {};

export function addFooterClass(className: string) {
	if (document.querySelector('.bottomNavToggles')?.classList.contains(className)) {
		if (footerCount[className] === undefined) {
			footerCount[className] = 0;
		}
		footerCount[className]++;
	} else {
		document.querySelector('.bottomNavToggles')?.classList.add(className);
	}
}

export function addHeaderClass(className: string) {
	if (document.querySelector('.navBar')?.classList.contains(className)) {
		if (headerCount[className] === undefined) {
			headerCount[className] = 0;
		}
		headerCount[className]++;
	} else {
		document.querySelector('.navBar')?.classList.add(className);
	}
}

export function removeFooterClass(className: string) {
	if (footerCount[className] > 0 && className in footerCount) {
		footerCount[className]--;
	} else {
		document.querySelector('.bottomNavToggles')?.classList.remove(className);
	}
}

export function resetFooterClass(className: string) {
	footerCount[className] = 0;
	document.querySelector('.bottomNavToggles')?.classList.remove(className);
}

export function removeHeaderClass(className: string) {
	if (headerCount[className] > 0 && className in headerCount) {
		headerCount[className]--;
	} else {
		document.querySelector('.navBar')?.classList.remove(className);
	}
}

export function resetHeaderClass(className: string) {
	headerCount[className] = 0;
	document.querySelector('.navBar')?.classList.remove(className);
}
