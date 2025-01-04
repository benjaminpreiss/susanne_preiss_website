<script lang="ts">
	import type { SvelteHTMLElements } from 'svelte/elements';

	let {
		side,
		transparent,
		children,
		...props
	}: SvelteHTMLElements['div'] & {
		side: 'left' | 'right';
		transparent: boolean;
	} = $props();
	const sideClass =
		side === 'left'
			? 'left-0 right-1/2 [.video-start_&]:-translate-x-full'
			: 'left-1/2 right-0 [.video-start_&]:translate-x-full';
	const transparentClass = transparent
		? 'bg-none aspect1:top-0'
		: 'bg-[#efeae3] opacity-90 aspect1:bottom-0 aspect1:top-[40%] [.mouse-enter_&]:opacity-80';
	const transparentSideClass = transparent
		? side === 'left'
			? 'aspect1:bottom-[50%]'
			: 'aspect1:bottom-[60%]'
		: '';
	const type = `m-half-cover-${side}${transparent ? '-transparent' : ''}`;
</script>

<div
	{...props}
	class="{type} transition duration-[200ms] ease-in-out {sideClass} {transparentSideClass} {transparentClass} absolute bottom-0 top-0 flex flex-col items-center justify-center aspect1:inset-x-0 {props.class}"
>
	{#if children}
		{@render children()}
	{/if}
</div>
