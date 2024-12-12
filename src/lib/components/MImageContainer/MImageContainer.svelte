<script lang="ts">
	let props = $props();
</script>

<div class="relative h-[80vmin] w-full overflow-hidden {props.class}">
	{@render props.children()}
</div>
