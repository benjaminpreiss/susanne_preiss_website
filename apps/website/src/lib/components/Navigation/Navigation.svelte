<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';
	import Button from '../Button/Button.svelte';
	import menu from './menu.json';
	let {
		hidden = false,
		showHomeAnchor = false
	}: { hidden?: boolean; showHomeAnchor?: boolean } & SvelteHTMLElements['footer'] = $props();
</script>

<header
	class="header font-roboto fixed left-0 top-0 -z-10 flex h-full w-full flex-col items-center justify-center bg-[#efeae3] text-lg tracking-[0.1em] opacity-0 transition-opacity duration-500 ease-in-out [.head-open_&]:z-[101] [.head-open_&]:opacity-100"
>
	{#each menu as { text, href }}
		<a
			class=" mx-5 my-2 flex-none flex-shrink text-center text-[#7D7D7D] no-underline visited:text-[#7D7D7D] visited:no-underline hover:text-[#2B2C36] hover:no-underline active:text-[#7D7D7D] active:no-underline"
			{href}>{text}</a
		>
	{/each}
</header>
<div class="navBar fixed left-0 right-0 top-0 z-[102] flex flex-row-reverse justify-between">
	<div
		class="navBarBackground absolute inset-0 -z-10 bg-transparent transition-transform delay-[250ms] duration-[250ms] ease-in-out [.head-open_&]:-translate-x-full [.head-open_&]:transition-all [.head-open_&]:duration-[250ms] [.head-open_&]:ease-in-out [.nav-open_&]:-translate-x-full [.nav-open_&]:transition-transform [.nav-open_&]:duration-[250ms] [.nav-open_&]:ease-in-out [.white-bg-hl_&]:bg-[#efeae3] [.white-bg-hr_&]:bg-[#efeae3]"
	></div>
	<!-- top Nav Toggle-->
	<div
		class="topNavToggle {hidden
			? 'hidden opacity-0'
			: ''} mx-6 my-5 transition-transform duration-500 ease-in-out [.kont-open_&\,.impressum-open_&\,.datenschutz-open_&]:translate-x-[300%]"
	>
		<Button
			class="relative block h-5 w-[1.875rem] bg-transparent p-0 text-center coarsePointer:h-7 coarsePointer:w-[2.625rem]"
		>
			<span
				class="bar fst absolute top-0 block h-[10%] w-full rounded-[10%/100%] bg-[#2b2c36] [.black-hr_&]:bg-[#2b2c36] [.nav-white.nav-open_&]:bg-black [.nav-white_&]:bg-[#efeae3] [.white-hr_&]:bg-[#efeae3]"
			></span>
			<span
				class="bar scd absolute top-[45%] block h-[10%] w-full rounded-[10%/100%] bg-[#2b2c36] [.black-hr_&]:bg-[#2b2c36] [.nav-white.nav-open_&]:bg-black [.nav-white_&]:bg-[#efeae3] [.white-hr_&]:bg-[#efeae3]"
			></span>
			<span
				class="bar thrd absolute top-[90%] block h-[10%] w-full rounded-[10%/100%] bg-[#2b2c36] [.black-hr_&]:bg-[#2b2c36] [.nav-white.nav-open_&]:bg-black [.nav-white_&]:bg-[#efeae3] [.white-hr_&]:bg-[#efeae3]"
			></span>
		</Button>
	</div>

	<div
		class="homeAnchor {showHomeAnchor
			? ''
			: 'hidden'} mx-6 my-5 transition-all delay-[250ms] duration-[250ms] ease-in-out [.nav-open_&]:-translate-x-[300%] [.nav-open_&]:transition-all [.nav-open_&]:duration-[250ms] [.nav-open_&]:ease-in-out"
	>
		<a
			class="m-0 box-content block h-6 w-[0.8125rem] bg-[url('/svg/SP_Website_Pfeil.svg')] bg-contain bg-center bg-no-repeat p-0 text-center coarsePointer:h-7 coarsePointer:w-[0.9375rem] [.black-hl_&]:bg-[url('/svg/SP_Website_Pfeil.svg')] [.white-hl_&]:bg-[url('/svg/SP_Website_Pfeil_white.svg')]"
			href="/"
		></a>
	</div>
</div>
