<script>
	import Footer from '$lib/components/Footer/Footer.svelte';
	import MBoxContainer from '$lib/components/MBoxContainer/MBoxContainer.svelte';
	import MImage from '$lib/components/MImage/MImage.svelte';
	import MImageContainerFull from '$lib/components/MImageContainerFull/MImageContainerFull.svelte';
	import Navigation from '$lib/components/Navigation/Navigation.svelte';
	import RedArrow from '$lib/components/RedArrow/RedArrow.svelte';
	import modules from './modules.json';
</script>

<Footer /><Navigation />
<div
	class="content z-10 pb-[70px] opacity-100 transition-all delay-[250ms] duration-[250ms] ease-in-out [.nav-open_&]:-translate-x-full [.nav-open_&]:opacity-0 [.nav-open_&]:transition-all [.nav-open_&]:duration-[250ms] [.nav-open_&]:ease-in-out"
>
	<MImageContainerFull class="effect-container black-footer black-header">
		<MImage class="bg-[url('/img/online_start.jpg')] bg-cover bg-center bg-no-repeat" />
	</MImageContainerFull>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">Home Office, die Herausforderung der Stunde.</span>
				Es wird Ihnen gefallen!
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				8 Module für virtuelle Führung. Wie kann ich mich (= ICH) und / oder mein Team entwickeln?
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span
					>Gerne unterstütze ich Sie dabei, wie Sie erfolgreich und effizient bleiben in der Krise
					und im Change, wenn sie Remote arbeiten.
				</span>
				<span>Als virtuelles Einzelcoaching oder als virtuelles Training mit Ihrem Team.</span>
			</p>
		</div>
	</div>

	<MBoxContainer class="white-bg-footer white-bg-header">
		{#each modules as module}
			<div
				class="m{module.id} effect-container m-2.5 border-[0.8px] border-solid border-black p-2.5"
			>
				<a class="m-link" href={module.pdfLink} target="_blank" rel="noreferrer noopener">
					<h6
						class="m-0 mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
					>
						{module.title}
					</h6>
					<p
						class="m-0 mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
					>
						{module.description}
					</p>
					<p
						class="redAnchor m-0 mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] text-[#ff0000] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
					>
						PDF <RedArrow
							class=" h-[0.7em] transition-transform duration-100 ease-in-out [.mouse-enter_&]:translate-x-full [.mouse-enter_&]:transition-transform [.mouse-enter_&]:duration-100 [.mouse-enter_&]:ease-in-out"
						/>
					</p>
				</a>
			</div>
		{/each}
	</MBoxContainer>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Sie sitzen in dieser Minute etwas verloren im home office? Sie brauchen Hilfe?
			</p>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				Schreiben Sie mir jetzt ein <a
					href="mailto:preiss@susanne-preiss.de"
					class="redAnchor text-[#ff0000]">Mail</a
				>
				oder rufen Sie mich an
				<a href="tel:00494069665175" class="redAnchor text-[#ff0000]">+49 (0) 40 – 69 66 51 77</a>.
			</p>
		</div>
	</div>
</div>
