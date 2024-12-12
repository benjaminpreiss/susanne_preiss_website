<script lang="ts">
	let props = $props();
</script>

<div class="m-image-container-full relative h-[60vh] w-full overflow-hidden {props.class}">
	{@render props.children()}
	<div
		class="m-scroll-hint absolute bottom-10 right-0 h-5 w-full bg-[url('/svg/susanne_preiss_web_arrow_01.svg')] bg-contain bg-center bg-no-repeat"
	></div>
</div>
