<script>
	import Button from '../Button/Button.svelte';
	let props = $props();
</script>

<Button
	class="m-play-button h-[3.75rem] max-h-[60%] w-[3.75rem] max-w-[60%] bg-[url('/svg/video_play_button_grey.svg')] bg-contain bg-center bg-no-repeat transition-transform duration-[200ms] ease-in-out [.mouse-enter_&]:scale-110 {props.class}"
/>
