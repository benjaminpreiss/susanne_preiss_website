<script lang="ts">
	let props = $props();
</script>

<div class="m-video-container relative h-[80vmin] overflow-hidden{props.class}">
	{@render props.children()}
</div>
