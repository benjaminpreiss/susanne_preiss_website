<script lang="ts">
	import { gsap } from 'gsap';
	import * as shared from '$lib/shared.js';
	import { PUBLIC_FULLPAGE_JS_KEY } from '$env/static/public';
	import FullPage from '$lib/components/FullPage/FullPage.svelte';
	import type { FullPageCallback } from '$lib/components/FullPage/types';
	import Footer from '$lib/components/Footer/Footer.svelte';
	import Navigation from '$lib/components/Navigation/Navigation.svelte';
	import sections from './sections.json';

	const fullpageOptions: ConstructorParameters<typeof import('fullpage.js')>[1] = {
		//callbacks
		onLeave: function (origin, destination, direction) {
			// enter first page: make all UI-elements disappear
			if (destination.index == 0 && !shared.footerIsOpen()) {
				// topNavToggle
				document
					.querySelectorAll<HTMLElement>(shared.TOP_NAV_TOGGLE_DIV_SEL)
					.forEach((el) => (el.style.opacity = '0'));
				document
					.querySelectorAll<HTMLElement>(shared.TOP_NAV_TOGGLE_DIV_SEL)
					.forEach((el) => (el.style.display = 'none'));
				// bottomNavToggles
				document
					.querySelectorAll<HTMLElement>(shared.BOTTOM_NAV_TOGGLES_SEL)
					.forEach((el) => (el.style.opacity = '0'));
				document
					.querySelectorAll<HTMLElement>(shared.BOTTOM_NAV_TOGGLES_SEL)
					.forEach((el) => (el.style.display = 'none'));
			}
			// make open header disappear on scroll
			if (shared.isOpen(shared.CLASS_HEADER_OPEN)) {
				shared.headerToggle();
			}
			// change UI elements color on slide sparring arrive
			if (destination.index == 6 && !shared.footerIsOpen()) {
				shared.whiteNavToggle();
			}
			// change UI elements color on slide sparring leave
			if (origin.index == 6 && !shared.footerIsOpen()) {
				shared.whiteNavToggle();
			}
			// disable fullpage scrolling when either kontakt, impressum or datenschutz is open
			if (shared.footerIsOpen()) {
				return false;
			}
		},
		afterLoad: function (origin, destination, direction) {
			// make topNavToggle and kontakt appear
			if (destination.index != 0) {
				// topNavToggle
				document
					.querySelectorAll<HTMLElement>(shared.TOP_NAV_TOGGLE_DIV_SEL)
					.forEach((el) => (el.style.display = 'block'));
				gsap.to(shared.TOP_NAV_TOGGLE_DIV_SEL, { duration: 0.4, opacity: '1' });
				// kontakt
				document
					.querySelectorAll<HTMLElement>(shared.BOTTOM_NAV_TOGGLES_SEL)
					.forEach((el) => (el.style.display = 'flex'));
				gsap.to(shared.BOTTOM_NAV_TOGGLES_SEL, { duration: 0.4, opacity: '1' });
			}
		},
		// license
		licenseKey: PUBLIC_FULLPAGE_JS_KEY,
		//options
		//anchors:['start', 'workshops', 'personal', 'business', 'management', 'speaker'],
		autoScrolling: true,
		scrollBar: false,
		css3: true,
		navigation: true,
		slidesNavigation: true,
		controlArrows: false,
		recordHistory: false,
		verticalCentered: false
		//offsetSectionsKey: 'B535F9D6-B0BE4324-82649228-DE5547BB',
		//offsetSections:true,
	};
	const fullpageCallback: FullPageCallback = (fp) => {
		//methods
		fp.setAllowScrolling(true);

		// add eventListeners
		shared.addSharedEventListeners();
	};
</script>

<Footer hidden={true} />
<Navigation hidden={true} />
<!-- #FIND YOUR GREATNESS-->
<FullPage options={fullpageOptions} callback={fullpageCallback}>
	<div class="section">
		<div class="slide greatness h-full">
			<div
				class="slideContent l-image-full backg-col flex h-full w-full flex-row-reverse items-stretch transition-transform duration-500 ease-in-out aspect1:flex-col"
			>
				<div
					class="scrollHint absolute bottom-[40px] right-0 z-10 h-[20px] w-1/2 bg-[url('/svg/susanne_preiss_web_arrow_01.svg')] bg-contain bg-center bg-no-repeat aspect1:hidden aspect1:w-full maxHeight500:hidden"
				></div>
				<div
					class="background-full relative flex items-center justify-center overflow-hidden transition-all duration-500 ease-in-out aspect1:flex-1 aspect1:basis-1/2"
				>
					<div
						class="logo absolute left-0 right-0 top-0 z-10 mt-[3.75rem] aspect1:w-full maxHeight500:hidden"
					>
						<a
							class="mx-auto box-border block h-[8vh] min-h-[10vmin] w-[277px] max-w-[70%] bg-[url('/svg/SP_logo_web.svg')] bg-contain bg-center bg-no-repeat"
							href=""
						></a>
					</div>
					<img
						src="/img/susanne_preiss_web_workshops.jpg"
						alt="Susanne Preiss Gesicht Nahaufnahme"
						class="h-full w-full object-cover object-center aspect1:object-top"
					/>
				</div>
				<div
					class="content relative flex flex-1 flex-shrink-0 basis-1/2 items-center justify-center transition-all duration-700 ease-in-out aspect1:flex-auto aspect1:flex-grow-0 maxHeight500:max-h-[100vh]"
				>
					<div class="textWrap flex max-h-full flex-none flex-col justify-center">
						<h2
							id="findYourGreatness"
							class="mx-[calc(1.875rem+7.5vmin)] mb-0 mt-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.58125rem+3.975vmin)] font-light italic leading-[0.85em] aspect1:mt-0 aspect1:hidden maxHeight500:hidden"
						>
							#FIND<br />YOUR<br />GREATNESS
						</h2>
						<h3
							class="mx-[calc(1.875rem+7.5vmin)] mb-0 mt-[calc(1.375rem+1.5vmin)] font-cormorant-garamond text-[calc(1.4375rem+2.25vmin)] font-light italic leading-[0.85em] aspect1:mx-10"
							id="susannePreissCoaching"
						>
							Susanne Preiss<br />Personal-<br />und Business-Coaching
						</h3>
						<h3
							id="aktuellOnlineTraining"
							class="scaling-links mx-[calc(1.875rem+7.5vmin)] mb-[calc(1.5rem+3vmin)] mt-[calc(1.375rem+1.5vmin)] font-cormorant-garamond text-[calc(1.4375rem+2.25vmin)] font-light italic leading-[0.85em] transition-transform duration-[200ms] ease-in-out hover:scale-110 aspect1:mx-10"
						>
							<a class="text-[#ff0000]" href="/online">
								Aktuell:<br />Online-Training in<br />der Krise und<br />für Home Office
								<svg
									id="Ebene_1"
									data-name="Ebene 1"
									xmlns="http://www.w3.org/2000/svg"
									xmlns:xlink="http://www.w3.org/1999/xlink"
									viewBox="0 0 26.94 14.83"
									class="h-[0.5em]"
									><defs
										><style>
											.cls-1 {
												fill: none;
											}
											.cls-2 {
												clip-path: url(#clip-path);
											}
											.cls-3 {
												fill: #e52521;
											}
										</style><clipPath id="clip-path" transform="translate(-2 -22.7)"
											><rect
												id="SVGID"
												class="cls-1"
												x="2"
												y="22.69"
												width="26.94"
												height="14.83"
											/></clipPath
										></defs
									><title>SP_Website_Pfeil2</title><g class="cls-2"
										><path
											class="cls-3"
											d="M24.35,27A25.31,25.31,0,0,1,20.5,22.7a12,12,0,0,0,.59,3.7,11.19,11.19,0,0,0,1.71,3.19H19.85c-2.66,0-4.61-.47-5.83-1.42A6.07,6.07,0,0,1,12,23.54H2a8.18,8.18,0,0,0,1.24,4A7.5,7.5,0,0,0,6.37,30.1a7.59,7.59,0,0,0-3.11,2.59,8.4,8.4,0,0,0-1.26,4H12A6.08,6.08,0,0,1,14,32.05c1.22-.94,3.17-1.42,5.83-1.42H22.8a11.06,11.06,0,0,0-1.71,3.19,12,12,0,0,0-.59,3.71,25.27,25.27,0,0,1,3.85-4.28,23.35,23.35,0,0,1,4.59-3.15A22.39,22.39,0,0,1,24.35,27"
											transform="translate(-2 -22.7)"
										/></g
									></svg
								>
							</a>
						</h3>
					</div>
				</div>
			</div>
		</div>
	</div>

	{#each sections as section}
		<div class="section">
			<div class="slide {section.class}">
				<div
					class="slideContent flex h-full w-full items-stretch transition-transform duration-500 ease-in-out aspect1:flex-col {section.layout} backg-col aspect1:[.nav-open_&]:-translate-y-full {section.layout ===
					'l-image-left'
						? '[.datenschutz-open_&\,.kont-open_&\,.impressum-open_&]:-translate-x-full flex-row'
						: '[.datenschutz-open_&\,.kont-open_&\,.impressum-open_&]:-translate-y-full flex-row-reverse'}"
				>
					<div
						class="background min-h-fit flex-none flex-shrink basis-1/2 overflow-hidden transition-all duration-500 ease-in-out [.nav-open_&]:opacity-0 {section.layout ===
						'l-image-left'
							? '[.head-open_&]:-translate-x-full'
							: '[.head-open_&]:translate-x-full'} relative flex items-center justify-center aspect1:[.nav-open_&]:transform-none {section.backgroundClass}"
					>
						{#if section.image}
							<img
								src={section.image}
								class="h-full w-full object-cover object-top"
								alt="Susanne Preiss Gesicht Nahaufnahme"
							/>
						{/if}
					</div>
					<div
						class="content relative flex flex-1 flex-grow-0 basis-1/2 items-center justify-center transition-all duration-700 ease-in-out aspect1:[.nav-open_&]:transform-none {section.layout ===
						'l-image-left'
							? '[.head-open_&]:translate-x-full'
							: '[.head-open_&]:-translate-x-full'}"
					>
						<div
							class="{section.textWrapClass} textWrap scaling-links flex max-h-full flex-none flex-col justify-center transition-transform duration-[200ms] ease-in-out hover:scale-110"
						>
							<a href={section.link}>
								<h2
									class="mx-[calc(1.375rem+1.5vmin)] mb-0 mt-0 font-cormorant-garamond text-[calc(1.58125rem+3.975vmin)] font-light italic leading-[0.85em]"
								>
									{@html section.title}
								</h2>
								<h1
									class="m-0 w-[85%] self-start text-center font-cormorant-garamond text-[calc(1.8625rem+7.35vmin)] font-light italic leading-[0.85em]"
								>
									»
								</h1>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/each}
</FullPage>
