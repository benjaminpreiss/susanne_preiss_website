<script lang="ts">
	import Footer from '$lib/components/Footer/Footer.svelte';
	import MBoxContainer from '$lib/components/MBoxContainer/MBoxContainer.svelte';
	import MImage from '$lib/components/MImage/MImage.svelte';
	import MImageContainerFull from '$lib/components/MImageContainerFull/MImageContainerFull.svelte';
	import Navigation from '$lib/components/Navigation/Navigation.svelte';
	import RedArrow from '$lib/components/RedArrow/RedArrow.svelte';
	import articles from './articles.json';
</script>

<Footer /><Navigation />
<div
	class="content z-10 pb-[70px] opacity-100 transition-all delay-[250ms] duration-[250ms] ease-in-out [.nav-open_&]:-translate-x-full [.nav-open_&]:opacity-0 [.nav-open_&]:transition-all [.nav-open_&]:duration-[250ms] [.nav-open_&]:ease-in-out"
>
	<MImageContainerFull class="effect-container black-footer black-header">
		<MImage class="bg-[url('/img/presse_start.jpg')] bg-cover bg-center bg-no-repeat" />
	</MImageContainerFull>
	<div
		class="m-text-container effect-container white-bg-footer white-bg-header relative mx-auto mb-[calc(1.625rem+4.5vmin)] mt-[calc(1.625rem+4.5vmin)] max-w-[800px]"
	>
		<div class="text">
			<h4
				class="mb-[calc(1.3125rem+0.75vmin)] mt-[calc(1.625rem+4.5vmin)] px-[calc(1.5rem+3vmin)] font-cormorant-garamond text-[calc(1.375rem+1.5vmin)] font-light italic [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span class="block">Schöne Geschichten!</span>
				Susanne Preiss in den Medien.
			</h4>
			<p
				class="mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
			>
				<span>Hier eine Auswahl relevanter Artikel und Interviews zu aktuellen Themen</span>
				<span>wie Entspannung im Job, Entschleunigung,</span>
				Auszeit und Pausenmanagement - Business und Privates.
			</p>
		</div>
	</div>

	{#each articles as article}
		<MBoxContainer class="white-bg-footer white-bg-header">
			<div class="effect-container m-2.5 border-[0.8px] border-solid border-black p-2.5">
				<a
					class="m-link article flex aspect1:flex-col {article.class}"
					href={article.pdfPath}
					target="_blank"
					rel="noreferrer noopener"
				>
					<div
						class="m-article-image {article.backgroundClass} min-h-full w-28 flex-none bg-contain bg-center bg-no-repeat aspect1:mx-[25%] aspect1:my-[5%] aspect1:w-1/2 aspect1:flex-none aspect1:basis-8"
					></div>
					<div class="m-article-text aspect1:text-center">
						<h6
							class="m-0 mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] font-semibold leading-[1.6em] aspect1:text-center [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
						>
							{article.title}
						</h6>
						<p
							class="m-0 mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] aspect1:text-center [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
						>
							{article.description}
						</p>
						<p
							class="redAnchor m-0 mb-5 mt-0 px-[calc(1.5rem+3vmin)] font-open-sans text-[0.875rem] leading-[1.6em] text-[#ff0000] [.content_&]:px-[calc(1.3125rem+0.75vmin)]"
						>
							PDF <RedArrow
								class="h-[0.7em] transition-transform duration-100 ease-in-out [.mouse-enter_&]:translate-x-full [.mouse-enter_&]:transition-transform [.mouse-enter_&]:duration-100 [.mouse-enter_&]:ease-in-out"
							/>
						</p>
					</div>
				</a>
			</div>
		</MBoxContainer>
	{/each}
</div>
