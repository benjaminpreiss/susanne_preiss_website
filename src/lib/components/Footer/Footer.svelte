<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';
	import Button from '../Button/Button.svelte';
	let { hidden = false, ...props }: { hidden?: boolean } & SvelteHTMLElements['footer'] = $props();
</script>

<footer
	class="bottomNavToggles font-roboto fixed inset-x-0 bottom-0 z-10 mx-6 my-5 transform items-end justify-end text-black {hidden
		? 'hidden opacity-0'
		: 'flex opacity-100'} transition-transform duration-500 ease-in-out aspect1:justify-between [&.black-f.white-bg-f]:bg-none [&.black-f]:bg-none [&.white-bg-f]:bg-[#efeae3] [&.white-f.white-bg-f]:bg-none [&.white-f]:bg-none [.datenschutz-open_&\,_.kont-open_&\,_.impressum-open_&]:z-20 [.datenschutz-open_&\,_.kont-open_&\,_.impressum-open_&]:duration-500 [.datenschutz-open_&\,_.kont-open_&\,_.impressum-open_&]:ease-in-out [.datenschutz-open_&]:bg-[#efeae3] [.datenschutz-open_&]:transition [.head-open_&]:translate-x-0 [.head-open_&]:translate-y-[300%]"
>
	<div
		class="impressum datenschutz mr-8 block transform self-center border-none transition-transform duration-500 ease-in-out [.datenschutz-open_&\,_.kont-open_&\,_.impressum-open_&]:translate-x-0 [.datenschutz-open_&\,_.kont-open_&\,_.impressum-open_&]:translate-y-[500%]"
	>
		<!-- impressum-->
		<div
			class="impressum inline-block h-full transform transition-transform duration-500 ease-in-out"
		>
			<Button
				class="impressum open bg-transparent px-[0.8125rem] text-[0.625rem] text-black aspect1:!text-black [&.white-bg-f]:text-[#efeae3] [.nav-white.nav-open_&]:text-black"
				>impressum</Button
			>
		</div>
		<!-- datenschutz-->
		<div
			class="datenschutz transform transition-transform duration-500 ease-in-out [.datenschutz-open_&\,_.kont-open_&\,_.impressum-open_&]:translate-x-0 [.datenschutz-open_&\,_.kont-open_&\,_.impressum-open_&]:translate-y-[500%]"
		>
			<Button
				class="datenschutz open aspect1:!text-black [&.white-bg-f]:text-[#efeae3] [.nav-white_&]:text-[#efeae3]"
				>datenschutz</Button
			>
		</div>
	</div>
	<!-- kontakt me button-->
	<div
		class="kontakt [.datenschutz-open_&,.kont-open_&,.impressum-open_&]:transition-transform [.datenschutz-open_&,.kont-open_&,.impressum-open_&]:duration-[350ms] [.datenschutz-open_&,.kont-open_&,.impressum-open_&]:ease-in-out h-[1.875rem] transform border-b-[0.8px] border-solid border-black transition-transform duration-500 ease-in-out [.datenschutz-open_&\,_.kont-open_&\,_.impressum-open_&]:translate-x-0 [.datenschutz-open_&\,_.kont-open_&\,_.impressum-open_&]:translate-y-[200%]"
	>
		<Button
			class="kontakt open font-roboto text text-center text-[0.875rem] text-black aspect1:!border-b-[0.8px] aspect1:!border-solid aspect1:!border-black aspect1:!text-black [&.white-bg-f]:border-b-[0.8px] [&.white-bg-f]:border-solid [&.white-bg-f]:border-[#efeae3] [&.white-bg-f]:text-[#efeae3] [.nav-white.nav-open_&]:border-b-[0.8px] [.nav-white.nav-open_&]:border-solid [.nav-white.nav-open_&]:border-black [.nav-white.nav-open_&]:text-black [.nav-white_&]:border-b-[0.8px] [.nav-white_&]:border-solid [.nav-white_&]:border-[#efeae3] [.nav-white_&]:text-[#efeae3]"
		>
			<span>KONTAKT</span>
		</Button>
	</div>
	<!-- offene bottomnav elemente schliessen-->
	<div
		class="schliessen [.datenschutz-open_&,.kont-open_&,.impressum-open_&]:transition-opacity [.datenschutz-open_&,.kont-open_&,.impressum-open_&]:duration-[350ms] [.datenschutz-open_&,.kont-open_&,.impressum-open_&]:ease-in-out [.datenschutz-open_&,.kont-open_&,.impressum-open_&]:delay-[350ms] [.datenschutz-open_&,.kont-open_&,.impressum-open_&]:opacity-100 fixed bottom-0 right-0 -z-10 h-[1.875rem] border-b-[0.8px] border-solid border-black opacity-0 transition-opacity duration-[0.35s] ease-in-out"
	>
		<Button
			class="bottomNav schliessen font-roboto text mb-5 mr-6 text-center text-[0.875rem] text-black aspect1:!text-black"
		>
			<span>SCHLIESSEN</span>
		</Button>
	</div>
</footer>
